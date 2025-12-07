import { RequestHandler } from 'express'
import logger from '../../../logger'
import { TIMEOUT_CONTENT } from '../../config/content'
import { getSubmissionId } from '../../utils/controllerHelpers'

export const renderTimeout: RequestHandler = (req, res, next) => {
  try {
    const submissionId = getSubmissionId(req)
    logger.info(`User session timed out for submissionId ${submissionId}`)

    if (req.session) {
      req.session.submissionAuthorized = null
    }

    res.render('pages/timeout', { submissionId, content: TIMEOUT_CONTENT })
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
