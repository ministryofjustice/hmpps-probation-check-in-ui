import getUserFriendlyString from '../../utils/userFriendlyStrings'
import { CheckinFormData, SUPPORT_FIELD_KEYS, normalizeAssistance } from '../../data/models/formData'
import CallbackRequested from '../../data/models/survey/callbackRequested'

export interface SummaryRow {
  key: { text: string }
  value: { text: string }
  actions: {
    items: Array<{
      href: string
      text: string
      visuallyHiddenText: string
    }>
  }
}

type TranslateFunction = (key: string) => string

/**
 * Build a single summary row
 */
function buildRow(
  keyText: string,
  valueText: string,
  href: string,
  actionText: string,
  hiddenText: string,
): SummaryRow {
  return {
    key: { text: keyText },
    value: { text: valueText },
    actions: {
      items: [{ href, text: actionText, visuallyHiddenText: hiddenText }],
    },
  }
}

/**
 * Build summary rows for the check answers page
 */
export function buildSummaryRows(formData: CheckinFormData, submissionId: string, t: TranslateFunction): SummaryRow[] {
  const rows: SummaryRow[] = []
  const basePath = `/${submissionId}`

  // Mental health row
  rows.push(
    buildRow(
      t('checkAnswers.rows.mentalHealth.key'),
      getUserFriendlyString(formData.mentalHealth ?? ''),
      `${basePath}/questions/mental-health?checkAnswers=true`,
      t('common.change'),
      t('checkAnswers.rows.mentalHealth.changeHidden'),
    ),
  )

  // Assistance row
  const assistanceArray = normalizeAssistance(formData.assistance)
  const assistanceText = assistanceArray.map(a => getUserFriendlyString(a.trim())).join(', ')

  rows.push(
    buildRow(
      t('checkAnswers.rows.assistance.key'),
      assistanceText,
      `${basePath}/questions/assistance?checkAnswers=true`,
      t('common.change'),
      t('checkAnswers.rows.assistance.changeHidden'),
    ),
  )

  // Conditional support detail rows
  for (const field of SUPPORT_FIELD_KEYS) {
    const fieldValue = formData[field]
    if (fieldValue) {
      rows.push(
        buildRow(
          t(`checkAnswers.rows.${field}.key`),
          fieldValue,
          `${basePath}/questions/assistance?checkAnswers=true`,
          t('common.change'),
          t(`checkAnswers.rows.${field}.changeHidden`),
        ),
      )
    }
  }

  // Callback row
  rows.push(
    buildRow(
      t('checkAnswers.rows.callback.key'),
      getUserFriendlyString(formData.callback ?? ''),
      `${basePath}/questions/callback?checkAnswers=true`,
      t('common.change'),
      t('checkAnswers.rows.callback.changeHidden'),
    ),
  )

  // Callback details row (conditional)
  if (formData.callback === CallbackRequested.Yes && formData.callbackDetails) {
    rows.push(
      buildRow(
        t('checkAnswers.rows.callbackDetails.key'),
        formData.callbackDetails,
        `${basePath}/questions/callback?checkAnswers=true`,
        t('common.change'),
        t('checkAnswers.rows.callbackDetails.changeHidden'),
      ),
    )
  }

  return rows
}

/**
 * Build video summary rows for the check answers page
 */
export function buildVideoRows(autoVerifyResult: string, submissionId: string, t: TranslateFunction): SummaryRow[] {
  const videoCheckText =
    autoVerifyResult === 'MATCH' ? t('checkAnswers.rows.videoCheck.match') : t('checkAnswers.rows.videoCheck.noMatch')

  return [
    {
      key: { text: t('checkAnswers.rows.videoCheck.key') },
      value: { text: videoCheckText },
      actions: {
        items: [
          {
            href: `/${submissionId}/video/view?checkAnswers=true`,
            text: t('common.view'),
            visuallyHiddenText: t('checkAnswers.rows.videoCheck.viewHidden'),
          },
        ],
      },
    },
  ]
}
