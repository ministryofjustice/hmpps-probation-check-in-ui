import { RequestHandler, Response } from 'express'
import logger from '../../logger'
import config from '../config'
import { services } from '../services'
import Checkin from '../data/models/checkin'
import { pageParams } from './submissionController'

type SubmissionLocals = { checkin: Checkin }

const { esupervisionService } = services()

export const renderLivenessInform: RequestHandler = async (req, res, next) => {
  try {
    res.render('pages/submission/liveness/inform', pageParams(req, res))
  } catch (error) {
    next(error)
  }
}

export const renderLivenessRecord: RequestHandler = async (req, res: Response<object, SubmissionLocals>, next) => {
  try {
    const { submissionId } = req.params
    const livenessSession = await esupervisionService.createLivenessSession(submissionId)

    res.render('pages/submission/liveness/record', {
      ...pageParams(req, res),
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

    res.json({ status: 'SUCCESS', result: result.result, isLive: result.isLive })
  } catch (error) {
    res.json({ status: 'ERROR', message: error.message })
  }
}

export const renderLivenessView: RequestHandler = async (req, res, next) => {
  try {
    res.render('pages/submission/liveness/view', pageParams(req, res))
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
