import { RequestHandler } from 'express'
import logger from '../../../logger'
import { services } from '../../services'
import { buildPageParams, getSubmissionId } from './helpers'
import { SubmissionLocals } from './types'
import MentalHealth from '../../data/models/survey/mentalHealth'
import SupportAspect from '../../data/models/survey/supportAspect'
import CallbackRequested from '../../data/models/survey/callbackRequested'
import { DeviceInfo } from '../../data/models/survey/surveyResponse'
import getUserFriendlyString from '../../utils/userFriendlyStrings'

const { esupervisionService } = services()

/**
 * Build summary rows for check answers page
 * This moves template logic to the controller
 */
function buildSummaryRows(
  formData: Record<string, unknown>,
  submissionId: string,
  t: (key: string) => string,
): Array<Record<string, unknown>> {
  const rows: Array<Record<string, unknown>> = []
  const basePath = `/${submissionId}`

  // Mental health row
  rows.push({
    key: { text: t('checkAnswers.rows.mentalHealth.key') },
    value: { text: getUserFriendlyString(formData.mentalHealth as string) },
    actions: {
      items: [
        {
          href: `${basePath}/questions/mental-health?checkAnswers=true`,
          text: t('common.change'),
          visuallyHiddenText: t('checkAnswers.rows.mentalHealth.changeHidden'),
        },
      ],
    },
  })

  // Assistance row
  const assistance = formData.assistance as string | string[]
  const assistanceArray = Array.isArray(assistance) ? assistance : assistance?.split(',') || []
  const assistanceText = assistanceArray.map(a => getUserFriendlyString(a.trim())).join(', ')

  rows.push({
    key: { text: t('checkAnswers.rows.assistance.key') },
    value: { text: assistanceText },
    actions: {
      items: [
        {
          href: `${basePath}/questions/assistance?checkAnswers=true`,
          text: t('common.change'),
          visuallyHiddenText: t('checkAnswers.rows.assistance.changeHidden'),
        },
      ],
    },
  })

  // Conditional support detail rows
  const supportFields = [
    { key: 'mentalHealthSupport', contentKey: 'mentalHealthSupport' },
    { key: 'alcoholSupport', contentKey: 'alcoholSupport' },
    { key: 'drugsSupport', contentKey: 'drugsSupport' },
    { key: 'moneySupport', contentKey: 'moneySupport' },
    { key: 'housingSupport', contentKey: 'housingSupport' },
    { key: 'supportSystemSupport', contentKey: 'supportSystemSupport' },
    { key: 'otherSupport', contentKey: 'otherSupport' },
  ]

  for (const field of supportFields) {
    if (formData[field.key]) {
      rows.push({
        key: { text: t(`checkAnswers.rows.${field.contentKey}.key`) },
        value: { text: formData[field.key] },
        actions: {
          items: [
            {
              href: `${basePath}/questions/assistance?checkAnswers=true`,
              text: t('common.change'),
              visuallyHiddenText: t(`checkAnswers.rows.${field.contentKey}.changeHidden`),
            },
          ],
        },
      })
    }
  }

  // Callback row
  rows.push({
    key: { text: t('checkAnswers.rows.callback.key') },
    value: { text: getUserFriendlyString(formData.callback as string) },
    actions: {
      items: [
        {
          href: `${basePath}/questions/callback?checkAnswers=true`,
          text: t('common.change'),
          visuallyHiddenText: t('checkAnswers.rows.callback.changeHidden'),
        },
      ],
    },
  })

  // Callback details row (conditional)
  if (formData.callback === 'YES' && formData.callbackDetails) {
    rows.push({
      key: { text: t('checkAnswers.rows.callbackDetails.key') },
      value: { text: formData.callbackDetails },
      actions: {
        items: [
          {
            href: `${basePath}/questions/callback?checkAnswers=true`,
            text: t('common.change'),
            visuallyHiddenText: t('checkAnswers.rows.callbackDetails.changeHidden'),
          },
        ],
      },
    })
  }

  return rows
}

/**
 * GET /:submissionId/check-your-answers
 * Render the check answers page with summary list
 */
export const renderCheckAnswers: RequestHandler = async (req, res, next) => {
  try {
    const { submissionId } = req.params
    const checkAnswersContent = res.locals.getNamespace('checkAnswers')
    const formData = res.locals.formData || {}

    // Build summary rows in controller (not template)
    const summaryRows = buildSummaryRows(formData, submissionId, res.locals.t)

    // Build video section row
    const autoVerifyResult = formData.autoVerifyResult as string
    const videoCheckText =
      autoVerifyResult === 'MATCH'
        ? res.locals.t('checkAnswers.rows.videoCheck.match')
        : res.locals.t('checkAnswers.rows.videoCheck.noMatch')

    const videoRows = [
      {
        key: { text: res.locals.t('checkAnswers.rows.videoCheck.key') },
        value: { text: videoCheckText },
        actions: {
          items: [
            {
              href: `/${submissionId}/video/view?checkAnswers=true`,
              text: res.locals.t('common.view'),
              visuallyHiddenText: res.locals.t('checkAnswers.rows.videoCheck.viewHidden'),
            },
          ],
        },
      },
    ]

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
  const { formData } = locals

  let assistance = formData.assistance as string | string[]
  // If user selects a single assistance option, convert it to an array
  if (typeof assistance === 'string') {
    assistance = [assistance]
  }

  // Parse device data if present
  const { deviceData } = formData
  let device: DeviceInfo | undefined

  if (deviceData && typeof deviceData === 'string') {
    try {
      device = JSON.parse(deviceData) as DeviceInfo
    } catch (error) {
      logger.error('Failed to parse device data', error)
    }
  }

  const submissionId = getSubmissionId(req)

  // Build submission payload
  const submission = {
    survey: {
      version: '2025-07-10@pilot',
      mentalHealth: formData.mentalHealth as MentalHealth,
      assistance: assistance as SupportAspect[],
      mentalHealthSupport: formData.mentalHealthSupport as string,
      alcoholSupport: formData.alcoholSupport as string,
      drugsSupport: formData.drugsSupport as string,
      moneySupport: formData.moneySupport as string,
      housingSupport: formData.housingSupport as string,
      supportSystemSupport: formData.supportSystemSupport as string,
      otherSupport: formData.otherSupport as string,
      callback: formData.callback as CallbackRequested,
      callbackDetails: formData.callbackDetails as string,
      device,
      checkinStartedAt: formData.checkinStartedAt as number,
    },
  }

  try {
    await esupervisionService.submitCheckin(submissionId, submission)
    res.redirect(`/${submissionId}/confirmation`)
  } catch (error) {
    next(error)
  }
}
