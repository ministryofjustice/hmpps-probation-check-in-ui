import { RequestHandler } from 'express'
import logger from '../../../logger'
import { getSubmissionId } from '../../utils/controllerHelpers'

export const renderTimeout: RequestHandler = (req, res, next) => {
  try {
    const submissionId = getSubmissionId(req)
    logger.info(`User session timed out for submissionId ${submissionId}`)

    if (req.session) {
      req.session.submissionAuthorized = null
    }

    res.render('pages/timeout', { submissionId })
  } catch (error) {
    next(error)
  }
}

export const handleKeepalive: RequestHandler = (req, res, next) => {
  try {
    res.json({ status: 'OK' })
  } catch (error) {
    next(error)
  }
}
