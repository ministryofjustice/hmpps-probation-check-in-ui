import { RequestHandler } from 'express'
import { PAGES } from '../../config/pages.config'
import { getSubmissionId, isCheckAnswersMode, buildBackLink } from '../../utils/controllerHelpers'

export const renderCallback: RequestHandler = (req, res, next) => {
  try {
    const submissionId = getSubmissionId(req)
    const cya = isCheckAnswersMode(req)
    const { title: pageTitle } = PAGES.callback

    const backLink = buildBackLink(submissionId, '/questions/assistance', cya)

    res.render('pages/callback', {
      pageTitle,
      backLink,
      submissionId,
      cya,
    })
  } catch (error) {
    next(error)
  }
}

export const handleCallback: RequestHandler = (req, res, next) => {
  try {
    const submissionId = getSubmissionId(req)
    const cya = isCheckAnswersMode(req)
    const { nextPage } = PAGES.callback

    const redirectPath = cya ? '/check-your-answers' : nextPage

    res.redirect(`/${submissionId}${redirectPath}`)
  } catch (error) {
    next(error)
  }
}
