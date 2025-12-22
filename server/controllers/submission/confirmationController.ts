import { RequestHandler } from 'express'
import { buildPageParams } from './helpers'

/**
 * GET /:submissionId/confirmation
 * Render the confirmation page and clear session
 */
// eslint-disable-next-line import/prefer-default-export
export const renderConfirmation: RequestHandler = async (req, res, next) => {
  try {
    const confirmationContent = res.locals.getNamespace('confirmation')

    // Clear session data
    req.session.destroy(() => {})

    res.render('pages/submission/confirmation', {
      ...buildPageParams(req),
      pageTitle: confirmationContent.pageTitle,
    })
  } catch (error) {
    next(error)
  }
}
