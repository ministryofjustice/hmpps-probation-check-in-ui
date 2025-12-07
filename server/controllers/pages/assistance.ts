import { RequestHandler, Request } from 'express'
import { PAGES } from '../../config/pages.config'
import { getSubmissionId, isCheckAnswersMode, buildBackLink } from '../../utils/controllerHelpers'

const SUPPORT_FIELD_MAP = {
  MENTAL_HEALTH: 'mentalHealthSupport',
  ALCOHOL: 'alcoholSupport',
  DRUGS: 'drugsSupport',
  MONEY: 'moneySupport',
  HOUSING: 'housingSupport',
  SUPPORT_SYSTEM: 'supportSystemSupport',
  OTHER: 'otherSupport',
} as const

const clearUnselectedFields = (req: Request, assistance: string[] | undefined): void => {
  if (!req.session?.formData) {
    throw new Error('Session not initialized')
  }

  const assistanceArray = Array.isArray(assistance) ? assistance : []

  Object.entries(SUPPORT_FIELD_MAP).forEach(([key, field]) => {
    if (!assistanceArray.includes(key)) {
      req.session.formData[field] = ''
    }
  })
}

export const renderAssistance: RequestHandler = (req, res, next) => {
  try {
    const submissionId = getSubmissionId(req)
    const cya = isCheckAnswersMode(req)
    const { title: pageTitle, hint } = PAGES.assistance

    const backLink = buildBackLink(submissionId, '/questions/mental-health', cya)

    res.render('pages/assistance', {
      pageTitle,
      hint,
      backLink,
      submissionId,
      cya,
    })
  } catch (error) {
    next(error)
  }
}

export const handleAssistance: RequestHandler = (req, res, next) => {
  try {
    const { assistance } = req.body
    const submissionId = getSubmissionId(req)
    const cya = isCheckAnswersMode(req)
    const { nextPage } = PAGES.assistance

    clearUnselectedFields(req, assistance)

    const redirectPath = cya ? '/check-your-answers' : nextPage

    res.redirect(`/${submissionId}${redirectPath}`)
  } catch (error) {
    next(error)
  }
}
