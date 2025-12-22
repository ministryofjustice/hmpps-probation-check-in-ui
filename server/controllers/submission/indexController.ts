import { RequestHandler } from 'express'
import { buildPageParams } from './helpers'

/**
 * GET /:submissionId/
 * Render the submission start page and initialize session
 */
export const renderIndex: RequestHandler = async (req, res, next) => {
  try {
    // Initialize form data in session
    req.session.formData = { checkinStartedAt: Date.now() }

    res.render('pages/submission/index', {
      ...buildPageParams(req),
      pageTitle: res.locals.t('index.start.pageTitle'),
    })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /:submissionId/start
 * Handle start button - redirect to verify page
 */
export const handleStart: RequestHandler = async (req, res) => {
  const { submissionId } = req.params
  res.redirect(`/${submissionId}/verify`)
}
