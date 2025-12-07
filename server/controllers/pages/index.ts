import { RequestHandler } from 'express'
import { PAGES } from '../../config/pages.config'
import { INDEX_CONTENT } from '../../config/content'
import { getSubmissionId } from '../../utils/controllerHelpers'

export const renderIndex: RequestHandler = (req, res, next) => {
  try {
    if (!req.session) {
      throw new Error('Session not initialized')
    }

    const submissionId = getSubmissionId(req)
    const { title: pageTitle } = PAGES.index

    req.session.formData = { checkinStartedAt: Date.now() }

    res.render('pages/index', {
      pageTitle,
      submissionId,
      content: INDEX_CONTENT,
    })
  } catch (error) {
    next(error)
  }
}

export const handleStart: RequestHandler = (req, res, next) => {
  try {
    const submissionId = getSubmissionId(req)
    res.redirect(`/${submissionId}/verify`)
  } catch (error) {
    next(error)
  }
}
