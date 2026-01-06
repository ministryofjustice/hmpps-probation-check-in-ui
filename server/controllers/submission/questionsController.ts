import { RequestHandler } from 'express'
import { buildPageParams, buildBackLink, buildRedirectUrl } from './helpers'
import SupportAspect from '../../data/models/survey/supportAspect'
import { CheckinFormData, SupportFieldKey } from '../../data/models/formData'

/**
 * Mapping of SupportAspect values to their corresponding form field names.
 */
const SUPPORT_FIELDS_MAP: Record<string, SupportFieldKey> = {
  [SupportAspect.MentalHealth]: 'mentalHealthSupport',
  [SupportAspect.Alcohol]: 'alcoholSupport',
  [SupportAspect.Drugs]: 'drugsSupport',
  [SupportAspect.Money]: 'moneySupport',
  [SupportAspect.Housing]: 'housingSupport',
  [SupportAspect.SupportSystem]: 'supportSystemSupport',
  [SupportAspect.Other]: 'otherSupport',
}

/**
 * Clear a support field in formData.
 */
function clearSupportField(formData: CheckinFormData, field: SupportFieldKey): void {
  // eslint-disable-next-line no-param-reassign
  formData[field] = ''
}

/**
 * GET /:submissionId/questions/mental-health
 * Render the mental health question form
 */
export const renderMentalHealth: RequestHandler = async (req, res, next) => {
  try {
    const content = res.locals.getNamespace('questions')
    const mentalHealthContent = content.mentalHealth as Record<string, unknown>

    // Build radio options from content
    const options = mentalHealthContent.options as Record<string, string>
    const mentalHealthOptions = Object.entries(options).map(([value, text]) => ({
      value,
      text,
    }))

    res.render('pages/submission/questions/mental-health', {
      ...buildPageParams(req),
      pageTitle: mentalHealthContent.pageTitle,
      backLink: buildBackLink(req, '/verify', '/check-your-answers'),
      mentalHealthOptions,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /:submissionId/questions/mental-health
 * Handle mental health form submission - redirect to next page
 */
export const handleMentalHealth: RequestHandler = async (req, res) => {
  const redirectUrl = buildRedirectUrl(req, '/questions/assistance')
  res.redirect(redirectUrl)
}

/**
 * GET /:submissionId/questions/assistance
 * Render the assistance/support needs form
 */
export const renderAssistance: RequestHandler = async (req, res, next) => {
  try {
    const content = res.locals.getNamespace('questions')
    const assistanceContent = content.assistance as Record<string, unknown>

    // Build checkbox options from content
    const options = assistanceContent.options as Record<string, string>
    const conditionalLabels = assistanceContent.conditionalLabels as Record<string, string>

    const assistanceOptions = Object.entries(options).map(([value, text]) => {
      const item: Record<string, unknown> = { value, text }

      // Add conditional textarea for relevant options
      const conditionalField = getConditionalFieldName(value)
      if (conditionalField && conditionalLabels[conditionalField]) {
        item.conditional = {
          fieldName: conditionalField,
          label: conditionalLabels[conditionalField],
        }
      }

      // Add divider before NO_HELP option
      if (value === 'NO_HELP') {
        item.behaviour = 'exclusive'
      }

      return item
    })

    // Insert divider before NO_HELP
    const noHelpIndex = assistanceOptions.findIndex(opt => opt.value === 'NO_HELP')
    if (noHelpIndex > 0) {
      assistanceOptions.splice(noHelpIndex, 0, {
        divider: assistanceContent.divider || 'or',
      } as Record<string, unknown>)
    }

    res.render('pages/submission/questions/assistance', {
      ...buildPageParams(req),
      pageTitle: assistanceContent.pageTitle,
      backLink: buildBackLink(req, '/questions/mental-health', '/check-your-answers'),
      assistanceOptions,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Map assistance option values to their conditional field names
 */
function getConditionalFieldName(value: string): string | null {
  const fieldMap: Record<string, string> = {
    MENTAL_HEALTH: 'mentalHealthSupport',
    ALCOHOL: 'alcoholSupport',
    DRUGS: 'drugsSupport',
    MONEY: 'moneySupport',
    HOUSING: 'housingSupport',
    SUPPORT_SYSTEM: 'supportSystemSupport',
    OTHER: 'otherSupport',
  }
  return fieldMap[value] || null
}

/**
 * POST /:submissionId/questions/assistance
 * Handle assistance form submission
 */
export const handleAssistance: RequestHandler = async (req, res) => {
  const { assistance } = req.body

  // Clear support fields when parent checkbox is unchecked
  const selectedAssistance = Array.isArray(assistance) ? assistance : [assistance]

  if (req.session.formData) {
    for (const [aspectValue, fieldKey] of Object.entries(SUPPORT_FIELDS_MAP)) {
      if (!selectedAssistance.includes(aspectValue)) {
        clearSupportField(req.session.formData, fieldKey)
      }
    }
  }

  const redirectUrl = buildRedirectUrl(req, '/questions/callback')
  res.redirect(redirectUrl)
}

/**
 * GET /:submissionId/questions/callback
 * Render the callback request form
 */
export const renderCallback: RequestHandler = async (req, res, next) => {
  try {
    const content = res.locals.getNamespace('questions')
    const callbackContent = content.callback as Record<string, unknown>

    // Build radio options from content
    const options = callbackContent.options as Record<string, string>
    const callbackOptions = Object.entries(options).map(([value, text]) => ({
      value,
      text,
    }))

    res.render('pages/submission/questions/callback', {
      ...buildPageParams(req),
      pageTitle: callbackContent.pageTitle,
      backLink: buildBackLink(req, '/questions/assistance', '/check-your-answers'),
      callbackOptions,
      conditionalLabel: callbackContent.conditionalLabel,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /:submissionId/questions/callback
 * Handle callback form submission - redirect to video inform
 */
export const handleCallback: RequestHandler = async (req, res) => {
  const redirectUrl = buildRedirectUrl(req, '/video/inform')
  res.redirect(redirectUrl)
}
