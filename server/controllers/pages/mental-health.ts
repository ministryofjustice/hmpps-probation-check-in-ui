import { RequestHandler } from 'express'
import { PAGES } from '../../config/pages.config'
import { getSubmissionId, isCheckAnswersMode, buildBackLink } from '../../utils/controllerHelpers'

export const renderMentalHealth: RequestHandler = (req, res, next) => {
  try {
    const submissionId = getSubmissionId(req)
    const cya = isCheckAnswersMode(req)
    const { title: pageTitle, hint, insetText } = PAGES.mentalHealth

    const backLink = buildBackLink(submissionId, '/verify', cya)

    res.render('pages/mental-health', {
      pageTitle,
      hint,
      insetText,
      backLink,
      submissionId,
      cya,
    })
  } catch (error) {
    next(error)
  }
}

export const handleMentalHealth: RequestHandler = (req, res, next) => {
  try {
    const submissionId = getSubmissionId(req)
    const cya = isCheckAnswersMode(req)
    const { nextPage } = PAGES.mentalHealth

    const redirectPath = cya ? '/check-your-answers' : nextPage

    res.redirect(`/${submissionId}${redirectPath}`)
  } catch (error) {
    next(error)
  }
}
