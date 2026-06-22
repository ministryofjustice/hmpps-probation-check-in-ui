import { RequestHandler, Response } from 'express'
import logger from '../../logger'
import config from '../config'
import { services } from '../services'
import Checkin from '../data/models/checkin'
import { pageParams } from './submissionController'

type SubmissionLocals = { checkin: Checkin }

const { esupervisionService } = services()

export const renderLivenessIndex: RequestHandler = async (req, res, next) => {
  try {
    req.session.formData = { checkinStartedAt: Date.now() }
    delete req.session.livenessFallbackAllowed
    res.render('pages/submission/liveness/index', pageParams(req))
  } catch (error) {
    next(error)
  }
}

export const renderLivenessInform: RequestHandler = async (req, res, next) => {
  try {
    res.render('pages/submission/liveness/inform', pageParams(req))
  } catch (error) {
    next(error)
  }
}

const isFallbackAllowed = (req: Parameters<RequestHandler>[0]): boolean => Boolean(req.session.livenessFallbackAllowed)

export const renderFallbackInform: RequestHandler = async (req, res, next) => {
  try {
    if (!isFallbackAllowed(req)) {
      res.redirect(`/${req.params.submissionId}/liveness/inform`)
      return
    }
    res.render('pages/submission/liveness/fallback/inform', pageParams(req))
  } catch (error) {
    next(error)
  }
}

export const renderFallbackRecord: RequestHandler = async (req, res, next) => {
  try {
    if (!isFallbackAllowed(req)) {
      res.redirect(`/${req.params.submissionId}/liveness/inform`)
      return
    }
    res.render('pages/submission/liveness/fallback/record', {
      ...pageParams(req),
      fallbackTimeoutMs: config.fallbackVerify.timeoutMs,
      fallbackMaxRetries: config.fallbackVerify.maxRetries,
    })
  } catch (error) {
    next(error)
  }
}

export const renderLivenessRecord: RequestHandler = async (req, res: Response<object, SubmissionLocals>, next) => {
  try {
    const { submissionId } = req.params
    const livenessSession = await esupervisionService.createLivenessSession(submissionId)
    const isMockRequested = req.query.mock === 'true'
    const isMockEnabledInEnv = process.env.MOCK_LIVENESS === 'true'

    const allowMocks = isMockRequested && isMockEnabledInEnv
    res.render('pages/submission/liveness/record', {
      ...pageParams(req),
      sessionId: livenessSession.sessionId,
      region: config.awsRegion,
      allowMocks,
    })
  } catch (error) {
    next(error)
  }
}

const LIVENESS_OUTCOME_TYPES = new Set([
  'timeout',
  'connection-timeout',
  'cancelled',
  'error',
  'camera-error',
  'camera-framerate',
  'multiple-faces',
  'landscape',
  'match',
  'not-live-match',
  'live-no-match',
  'not-live-no-match',
])

export const renderLivenessOutcome: RequestHandler = async (req, res, next) => {
  try {
    const { type } = req.params
    if (!LIVENESS_OUTCOME_TYPES.has(type)) {
      res.status(404).render('pages/submission/not-found')
      return
    }
    // Reaching any non-match outcome means the user has tried liveness and hit an issue,
    // so they're allowed to switch to the video fallback.
    if (type !== 'match') {
      req.session.livenessFallbackAllowed = true
    }
    res.render('pages/submission/liveness/outcome', { ...pageParams(req), outcomeType: type })
  } catch (error) {
    next(error)
  }
}

export const handleLivenessVerify: RequestHandler = async (req, res, next) => {
  try {
    const { submissionId } = req.params
    const { sessionId } = req.query as { sessionId: string }
    logger.info('handleLivenessVerify', submissionId)
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 'no-cache')

    const result = await esupervisionService.verifyLiveness(submissionId, sessionId)
    req.session.formData.autoVerifyResult = result.result
    req.session.formData.isLive = result.isLive

    res.json({ status: 'SUCCESS', result: result.result, isLive: result.isLive })
  } catch (error) {
    res.json({ status: 'ERROR', message: error.message })
  }
}

// Cap the Amplify state we forward to the API so a misbehaving client can't write
// arbitrarily large strings into the audit row. Realistic values are short identifiers
// like MULTIPLE_FACES_ERROR (well under 100 chars).
const MAX_STATE_LENGTH = 100

export const handleLivenessClientFailure: RequestHandler = async (req, res, next) => {
  try {
    const { submissionId } = req.params
    const rawState = typeof req.body?.state === 'string' ? req.body.state : undefined
    const state = rawState ? rawState.slice(0, MAX_STATE_LENGTH) : undefined
    logger.info('handleLivenessClientFailure', submissionId, state)
    await esupervisionService.reportLivenessClientFailure(submissionId, state)
    res.status(204).end()
  } catch (error) {
    // Recording the failure is best-effort — never block the user's navigation.
    logger.warn('Failed to record client-side liveness failure', error)
    res.status(204).end()
  }
}

export const renderLivenessCheckAnswers: RequestHandler = async (req, res, next) => {
  try {
    res.render('pages/submission/liveness/check-answers', pageParams(req))
  } catch (error) {
    next(error)
  }
}

export const renderLivenessView: RequestHandler = async (req, res, next) => {
  try {
    res.render('pages/submission/liveness/view', pageParams(req))
  } catch (error) {
    next(error)
  }
}

export const getLivenessSession: RequestHandler = async (req, res, next) => {
  try {
    const { submissionId } = req.params
    const livenessSession = await esupervisionService.createLivenessSession(submissionId)
    res.json(livenessSession)
  } catch (error) {
    res.json({ status: 'ERROR', message: error.message })
  }
}

export const getLivenessCredentials: RequestHandler = async (req, res, next) => {
  try {
    const { submissionId } = req.params
    const credentials = await esupervisionService.getLivenessCredentials(submissionId)
    res.json(credentials)
  } catch (error) {
    res.json({ status: 'ERROR', message: error.message })
  }
}

export const getSnapshotUploadUrl: RequestHandler = async (req, res, next) => {
  try {
    const { submissionId } = req.params
    // The client sends a SHA-256 (base64) of the snapshot it is about to upload, so the
    // API can bind the presigned URL to those exact bytes.
    const { sha256 } = (req.body ?? {}) as { sha256?: unknown }
    if (typeof sha256 !== 'string' || sha256.length === 0) {
      throw new Error('Missing snapshot sha256')
    }

    const uploadLocations = await esupervisionService.getCheckinUploadLocation(
      submissionId,
      { video: 'video/mp4', snapshots: ['image/jpeg'] },
      { snapshots: [{ sha256 }] },
    )

    if (!uploadLocations.snapshots?.length) {
      throw new Error('Failed to get snapshot upload location')
    }

    const snapshot = uploadLocations.snapshots[0]
    res.json({ url: snapshot.url, requiredHeaders: snapshot.requiredHeaders ?? null })
  } catch (error) {
    res.json({ status: 'ERROR', message: error.message })
  }
}
