import { Router, Request, Response } from 'express'
import { LRUCache } from 'lru-cache'
import config from '../config'
import logger from '../../logger'

const UPSTREAM_INACTIVITY_TIMEOUT_MS = 30_000
const RATE_LIMIT_MAX = 30
const RATE_LIMIT_WINDOW_MS = 60_000
const MAX_MESSAGE_LENGTH = 2000
const MAX_ID_LENGTH = 200
const MAX_SESSION_TOKEN_LENGTH = 500
const MAX_FEEDBACK_VALUE_LENGTH = 2000
const FEEDBACK_TIMEOUT_MS = 15_000

export const rateLimitCache = new LRUCache<string, { count: number; resetAt: number }>({
  max: 10_000,
  ttl: RATE_LIMIT_WINDOW_MS,
  ttlResolution: 1_000,
})

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitCache.get(ip, { updateAgeOnGet: false })
  if (!entry || entry.resetAt < now) {
    rateLimitCache.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT_MAX) return false
  entry.count += 1
  return true
}

// Optional fields are relayed upstream under the server's API key, so they
// must at least be strings of a sane length. `undefined` = absent, `null` = invalid.
function optionalString(value: unknown, maxLength: number): string | undefined | null {
  if (value === undefined || value === null) return undefined
  if (typeof value !== 'string' || value.length > maxLength) return null
  return value
}

// req.ip honours X-Forwarded-For (the app trusts the proxy). On Cloud Platform the
// ingress-nginx replaces that header with the real client address (it does not
// use forwarded headers), so the value cannot be forged from outside the cluster.
function clientIp(req: Request): string {
  return req.ip ?? req.socket.remoteAddress ?? 'unknown'
}

export default function chatbotRoutes(): Router {
  const router = Router()

  router.post('/chat', async (req: Request, res: Response) => {
    const { apiUrl, apiKey } = config.chatbot
    // Forward the language the person chose with the site toggle (i18next sets
    // req.language) so Fred answers in Welsh or English deterministically.
    const lang = req.language === 'cy' ? 'cy' : 'en'
    const upstreamUrl = apiUrl ? `${apiUrl}?domain=online-checkins&lang=${lang}` : ''

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('X-Accel-Buffering', 'no')

    const send = (payload: Record<string, unknown>) => {
      res.write(`data: ${JSON.stringify(payload)}\n\n`)
    }

    // The widget shows the raw HTTP status on any non-2xx, so rate-limit
    // rejections go out as an SSE error event like every other failure path.
    if (!checkRateLimit(clientIp(req))) {
      logger.warn('Chatbot rate limit exceeded')
      send({ type: 'error', text: 'Too many requests. Please wait a minute before sending another message.' })
      res.end()
      return
    }

    if (!config.chatbot.enabled || !apiUrl || !apiKey) {
      send({ type: 'error', text: 'Chatbot service is not configured' })
      res.end()
      return
    }

    const body = req.body ?? {}
    const { message } = body
    const conversationId = optionalString(body.conversation_id, MAX_ID_LENGTH)
    const sessionToken = optionalString(body.session_token, MAX_SESSION_TOKEN_LENGTH)

    if (
      typeof message !== 'string' ||
      message.length === 0 ||
      message.length > MAX_MESSAGE_LENGTH ||
      conversationId === null ||
      sessionToken === null
    ) {
      send({ type: 'error', text: 'Invalid request' })
      res.end()
      return
    }

    const upstreamBody = {
      message,
      conversation_id: conversationId,
      session_token: sessionToken,
    }

    const controller = new AbortController()
    let idleTimer: NodeJS.Timeout = setTimeout(() => controller.abort(), UPSTREAM_INACTIVITY_TIMEOUT_MS)
    const resetIdleTimer = () => {
      clearTimeout(idleTimer)
      idleTimer = setTimeout(() => controller.abort(), UPSTREAM_INACTIVITY_TIMEOUT_MS)
    }
    res.on('close', () => {
      clearTimeout(idleTimer)
      if (!res.writableFinished) controller.abort()
    })

    try {
      const upstream = await fetch(upstreamUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
          Accept: 'text/event-stream',
        },
        body: JSON.stringify(upstreamBody),
        signal: controller.signal,
      })

      if (!upstream.ok) {
        const text = await upstream.text().catch(() => '')
        logger.warn(
          { status: upstream.status, statusText: upstream.statusText, body: text.slice(0, 1000) },
          'Chatbot upstream returned a non-2xx response',
        )
        send({ type: 'error', text: 'Chatbot service unavailable' })
        res.end()
        return
      }

      if (!upstream.body) {
        send({ type: 'error', text: 'Chatbot service returned no response body' })
        res.end()
        return
      }

      const reader = upstream.body.getReader()
      try {
        for (;;) {
          // eslint-disable-next-line no-await-in-loop
          const { done, value } = await reader.read()
          if (done) break
          if (value) {
            resetIdleTimer()
            res.write(value)
          }
        }
      } finally {
        reader.releaseLock()
      }
      if (!res.writableEnded) res.end()
    } catch (err) {
      if ((err as { name?: string }).name === 'AbortError') {
        logger.warn('Chatbot proxy aborted (timeout or client disconnect)')
        if (!res.writableEnded) {
          send({ type: 'error', text: 'Chatbot request timed out' })
          res.end()
        }
        return
      }
      logger.warn({ err }, 'Chatbot proxy failed')
      if (!res.writableEnded) {
        send({ type: 'error', text: 'Chatbot service unavailable' })
        res.end()
      }
    } finally {
      clearTimeout(idleTimer)
    }
  })

  router.post('/chat/feedback', async (req: Request, res: Response) => {
    const { apiUrl, apiKey } = config.chatbot

    if (!config.chatbot.enabled || !apiUrl || !apiKey) {
      res.status(503).json({ error: 'Chatbot service is not configured' })
      return
    }

    const derived = apiUrl.replace(/\/chat-embed-stream(\/?)$/, '/feedback-embed$1')
    if (derived === apiUrl) {
      logger.warn({ apiUrl }, 'CHATBOT_API_URL does not end with /chat-embed-stream; cannot derive feedback URL')
      res.status(503).json({ error: 'Chatbot feedback endpoint is not configured' })
      return
    }
    const feedbackUrl = derived

    if (!checkRateLimit(clientIp(req))) {
      logger.warn('Chatbot feedback rate limit exceeded')
      res.status(429).json({ error: 'Too many requests' })
      return
    }

    const body = req.body ?? {}
    const messageId = optionalString(body.message_id, MAX_ID_LENGTH)
    const feedbackType = optionalString(body.feedback_type, 50)
    const conversationId = optionalString(body.conversation_id, MAX_ID_LENGTH)
    const sessionToken = optionalString(body.session_token, MAX_SESSION_TOKEN_LENGTH)
    const feedbackValue = body.feedback_value ?? null
    const feedbackValueValid =
      feedbackValue === null ||
      (['string', 'number', 'boolean'].includes(typeof feedbackValue) &&
        String(feedbackValue).length <= MAX_FEEDBACK_VALUE_LENGTH)

    if (!messageId || !feedbackType) {
      res.status(400).json({ error: 'message_id and feedback_type are required' })
      return
    }
    if (conversationId === null || sessionToken === null || !feedbackValueValid) {
      res.status(400).json({ error: 'Invalid request' })
      return
    }

    try {
      const upstream = await fetch(feedbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          message_id: messageId,
          feedback_type: feedbackType,
          feedback_value: feedbackValue,
          conversation_id: conversationId,
          session_token: sessionToken,
        }),
        signal: AbortSignal.timeout(FEEDBACK_TIMEOUT_MS),
      })

      if (!upstream.ok) {
        const text = await upstream.text().catch(() => '')
        logger.warn(
          { status: upstream.status, body: text.slice(0, 500) },
          'Chatbot feedback upstream returned a non-2xx response',
        )
        res.status(502).json({ error: 'Chatbot feedback service unavailable' })
        return
      }

      res.status(200).json({ message: 'Feedback recorded' })
    } catch (err) {
      logger.warn({ err }, 'Chatbot feedback proxy failed')
      res.status(502).json({ error: 'Chatbot feedback service unavailable' })
    }
  })

  return router
}
