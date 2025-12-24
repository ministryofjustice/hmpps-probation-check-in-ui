import { RequestHandler } from 'express'
import logger from '../../../logger'
import { buildPageParams, getSubmissionId } from './helpers'
import { buildSummaryRows, buildVideoRows } from './summaryRowBuilder'
import { SubmissionLocals } from './types'
import { DeviceInfo } from '../../data/models/survey/surveyResponse'
import { createEmptyFormData, normalizeAssistance } from '../../data/models/formData'

/**
 * GET /:submissionId/check-your-answers
 * Render the check answers page with summary list
 */
export const renderCheckAnswers: RequestHandler = async (req, res, next) => {
  try {
    const { submissionId } = req.params
    const checkAnswersContent = res.locals.getNamespace('checkAnswers')
    const formData = res.locals.formData ?? createEmptyFormData()

    const summaryRows = buildSummaryRows(formData, submissionId, res.locals.t)
    const autoVerifyResult = formData.autoVerifyResult ?? ''
    const videoRows = buildVideoRows(autoVerifyResult, submissionId, res.locals.t)

    res.render('pages/submission/check-answers', {
      ...buildPageParams(req),
      pageTitle: checkAnswersContent.pageTitle,
      backLink: `/${submissionId}/video/view`,
      summaryRows,
      videoRows,
      sections: checkAnswersContent.sections,
      confirm: checkAnswersContent.confirm,
      buttonText: checkAnswersContent.submitButton,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * POST /:submissionId/check-your-answers
 * Handle final submission
 */
export const handleSubmission: RequestHandler = async (req, res, next) => {
  const locals = res.locals as SubmissionLocals
  const { formData, esupervisionService } = locals
  const submissionId = getSubmissionId(req)

  // Validate required fields before submission
  if (!formData.mentalHealth) {
    return next(new Error('Mental health response is required'))
  }
  if (!formData.callback) {
    return next(new Error('Callback response is required'))
  }

  // Note: assistance is intentionally optional - users may select "No, I do not need help"
  // or the field may be empty. normalizeAssistance handles this gracefully by returning [].
  const assistance = normalizeAssistance(formData.assistance)
  const device = parseDeviceData(formData.deviceData)

  const submission = {
    survey: {
      version: '2025-07-10@pilot',
      mentalHealth: formData.mentalHealth,
      assistance,
      mentalHealthSupport: formData.mentalHealthSupport ?? '',
      alcoholSupport: formData.alcoholSupport ?? '',
      drugsSupport: formData.drugsSupport ?? '',
      moneySupport: formData.moneySupport ?? '',
      housingSupport: formData.housingSupport ?? '',
      supportSystemSupport: formData.supportSystemSupport ?? '',
      otherSupport: formData.otherSupport ?? '',
      callback: formData.callback,
      callbackDetails: formData.callbackDetails ?? '',
      device,
      checkinStartedAt: formData.checkinStartedAt,
    },
  }

  try {
    await esupervisionService.submitCheckin(submissionId, submission)
    return res.redirect(`/${submissionId}/confirmation`)
  } catch (error) {
    return next(error)
  }
}

/**
 * Parse device data JSON string to DeviceInfo object.
 */
function parseDeviceData(deviceData: string | undefined): DeviceInfo | undefined {
  if (!deviceData) {
    return undefined
  }

  try {
    return JSON.parse(deviceData) as DeviceInfo
  } catch (error) {
    logger.error('Failed to parse device data', error)
    return undefined
  }
}
