import { RequestHandler } from 'express'
import logger from '../../../logger'

/**
 * GET /:submissionId/timeout
 * Render the session timeout page
 */
export const renderTimeout: RequestHandler = async (req, res) => {
  const { submissionId } = req.params
  const errorsContent = res.locals.getNamespace('errors')
  const timeoutContent = errorsContent.timeout as Record<string, string>

  logger.info(`User session timed out for submissionId ${submissionId}`)

  // Clear session authorization
  req.session.submissionAuthorized = undefined

  res.render('pages/submission/timeout', {
    submissionId,
    pageTitle: timeoutContent.pageTitle,
  })
}

/**
 * GET /:submissionId/keepalive
 * Keep the session alive (called by client JS)
 */
export const handleKeepalive: RequestHandler = async (req, res) => {
  res.json({ status: 'OK' })
}
