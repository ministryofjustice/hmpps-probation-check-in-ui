import express, { Express } from 'express'
import request from 'supertest'
import chatbotRoutes, { rateLimitCache } from './chatbot'
import config from '../config'

jest.mock('../config', () => ({
  __esModule: true,
  default: {
    chatbot: {
      enabled: true,
      apiUrl: 'https://chatbot.example.com/chatbot/chat-embed-stream',
      apiKey: 'test-api-key',
    },
  },
}))

jest.mock('../../logger', () => ({
  warn: jest.fn(),
  info: jest.fn(),
  error: jest.fn(),
}))

const mockFetch = jest.fn()
global.fetch = mockFetch

function makeApp(language?: string): Express {
  const app = express()
  app.use(express.json())
  if (language) {
    app.use((req, _res, next) => {
      ;(req as express.Request & { language: string }).language = language
      next()
    })
  }
  app.use('/api/chatbot', chatbotRoutes())
  return app
}

function sseStream(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  let i = 0
  return new ReadableStream({
    pull(controller) {
      if (i < chunks.length) {
        controller.enqueue(encoder.encode(chunks[i]))
        i += 1
      } else {
        controller.close()
      }
    },
  })
}

beforeEach(() => {
  mockFetch.mockReset()
  rateLimitCache.clear()
})

describe('POST /api/chatbot/chat', () => {
  it('streams a successful upstream response through', async () => {
    const chunk = 'data: {"type":"text","text":"Hello"}\n\n'
    mockFetch.mockResolvedValue({
      ok: true,
      body: sseStream([chunk]),
    })

    const res = await request(makeApp())
      .post('/api/chatbot/chat')
      .send({ message: 'Hello' })
      .expect(200)
      .expect('Content-Type', /text\/event-stream/)

    expect(res.text).toContain(chunk)
  })

  it('returns SSE error event when upstream returns non-2xx', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
      text: async () => 'upstream down',
    })

    const res = await request(makeApp()).post('/api/chatbot/chat').send({ message: 'Hello' }).expect(200)

    expect(res.text).toContain('"type":"error"')
    expect(res.text).toContain('unavailable')
  })

  it('returns SSE error event when chatbot is not configured', async () => {
    const original = config.chatbot
    config.chatbot = { enabled: false, apiUrl: '', apiKey: '' }

    const res = await request(makeApp()).post('/api/chatbot/chat').send({ message: 'Hello' }).expect(200)
    config.chatbot = original

    expect(res.text).toContain('"type":"error"')
    expect(res.text).toContain('not configured')
  })

  it('returns SSE error event when message is missing', async () => {
    const res = await request(makeApp()).post('/api/chatbot/chat').send({}).expect(200)
    expect(res.text).toContain('"type":"error"')
  })

  it('returns SSE error event when message exceeds max length', async () => {
    const res = await request(makeApp())
      .post('/api/chatbot/chat')
      .send({ message: 'x'.repeat(2001) })
      .expect(200)
    expect(res.text).toContain('"type":"error"')
  })

  it('returns SSE error event when rate limit is exceeded', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      body: sseStream(['data: {"type":"text","text":"Hi"}\n\n']),
    })

    for (let i = 0; i < 30; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await request(makeApp()).post('/api/chatbot/chat').send({ message: 'Hello' }).expect(200)
    }

    const res = await request(makeApp()).post('/api/chatbot/chat').send({ message: 'Hello' }).expect(200)
    expect(res.text).toContain('"type":"error"')
    expect(res.text).toContain('Too many requests')
    expect(mockFetch).toHaveBeenCalledTimes(30)
  })

  it('appends lang=cy to upstream URL when site language is Welsh', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      body: sseStream(['data: {"type":"text","text":"Shwmae"}\n\n']),
    })

    await request(makeApp('cy')).post('/api/chatbot/chat').send({ message: 'Shwmae' }).expect(200)

    const [calledUrl] = mockFetch.mock.calls[0]
    expect(calledUrl).toContain('lang=cy')
  })

  it('appends lang=en to upstream URL when site language is English', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      body: sseStream(['data: {"type":"text","text":"Hello"}\n\n']),
    })

    await request(makeApp('en')).post('/api/chatbot/chat').send({ message: 'Hello' }).expect(200)

    const [calledUrl] = mockFetch.mock.calls[0]
    expect(calledUrl).toContain('lang=en')
  })
})

describe('POST /api/chatbot/chat/feedback', () => {
  it('proxies valid feedback to the upstream feedback endpoint', async () => {
    mockFetch.mockResolvedValue({ ok: true })

    const res = await request(makeApp())
      .post('/api/chatbot/chat/feedback')
      .send({ message_id: 'msg-1', feedback_type: 'thumbs_up' })
      .expect(200)

    expect(res.body).toEqual({ message: 'Feedback recorded' })
    expect(mockFetch).toHaveBeenCalledWith(
      'https://chatbot.example.com/chatbot/feedback-embed',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('returns 400 when message_id or feedback_type is missing', async () => {
    await request(makeApp()).post('/api/chatbot/chat/feedback').send({ message_id: 'msg-1' }).expect(400)

    await request(makeApp()).post('/api/chatbot/chat/feedback').send({ feedback_type: 'thumbs_up' }).expect(400)
  })

  it('derives feedback URL by replacing chat-embed-stream with feedback-embed', async () => {
    mockFetch.mockResolvedValue({ ok: true })

    await request(makeApp())
      .post('/api/chatbot/chat/feedback')
      .send({ message_id: 'msg-1', feedback_type: 'thumbs_down' })
      .expect(200)

    const [calledUrl] = mockFetch.mock.calls[0]
    expect(calledUrl).toBe('https://chatbot.example.com/chatbot/feedback-embed')
  })

  it('returns 502 when upstream feedback returns non-2xx', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'error',
    })

    await request(makeApp())
      .post('/api/chatbot/chat/feedback')
      .send({ message_id: 'msg-1', feedback_type: 'thumbs_up' })
      .expect(502)
  })
})
