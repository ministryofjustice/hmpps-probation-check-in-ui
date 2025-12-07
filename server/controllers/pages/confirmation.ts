import { RequestHandler } from 'express'
import { PAGES } from '../../config/pages.config'
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
    })
  } catch (error) {
    next(error)
  }
}

export default renderConfirmation
