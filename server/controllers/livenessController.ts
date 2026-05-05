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

export const renderFallbackInform: RequestHandler = async (req, res, next) => {
  try {
    res.render('pages/submission/liveness/fallback/inform', pageParams(req))
  } catch (error) {
    next(error)
  }
}

export const renderFallbackRecord: RequestHandler = async (req, res, next) => {
  try {
    res.render('pages/submission/liveness/fallback/record', pageParams(req))
  } catch (error) {
    next(error)
  }
}

export const renderLivenessRecord: RequestHandler = async (req, res: Response<object, SubmissionLocals>, next) => {
  try {
    const { submissionId } = req.params
    const livenessSession = await esupervisionService.createLivenessSession(submissionId)

    res.render('pages/submission/liveness/record', {
      ...pageParams(req),
      sessionId: livenessSession.sessionId,
      region: config.awsRegion,
    })
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
    // Optional sha256 lets the API bind the URL to the snapshot's bytes.
    // GET requests will arrive with no body (back-compat for older client builds);
    // POST requests carry { sha256 } in the JSON body.
    const sha256 =
      typeof (req.body as { sha256?: unknown })?.sha256 === 'string'
        ? (req.body as { sha256: string }).sha256
        : undefined

    const uploadLocations = await esupervisionService.getCheckinUploadLocation(
      submissionId,
      { video: 'video/mp4', snapshots: ['image/jpeg'] },
      sha256 ? { snapshots: [{ sha256 }] } : undefined,
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
