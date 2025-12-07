import { RequestHandler } from 'express'
import { PAGES } from '../../config/pages.config'
import { CONFIRMATION_CONTENT } from '../../config/content'
import { getSubmissionId } from '../../utils/controllerHelpers'

const renderConfirmation: RequestHandler = (req, res, next) => {
  try {
    const submissionId = getSubmissionId(req)
    const { title: pageTitle } = PAGES.confirmation

    // Clear session after successful submission
    if (req.session) {
      req.session = null
    }

    res.render('pages/confirmation', {
      pageTitle,
      submissionId,
      content: CONFIRMATION_CONTENT,
    })
  } catch (error) {
    next(error)
  }
}

export default renderConfirmation
