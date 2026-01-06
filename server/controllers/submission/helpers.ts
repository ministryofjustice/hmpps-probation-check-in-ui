import { Request } from 'express'

/**
 * Extract submission ID from request params
 */
export function getSubmissionId(req: Request): string {
  return req.params.submissionId
}

/**
 * Build common page parameters for submission pages
 */
export function buildPageParams(req: Request): Record<string, string | boolean> {
  const cya = req.query.checkAnswers === 'true'
  return {
    cya,
    autoVerifyResult: cya ? (req.session?.formData?.autoVerifyResult ?? '') : '',
    submissionId: getSubmissionId(req),
  }
}

/**
 * Build redirect URL, respecting checkAnswers query param
 */
export function buildRedirectUrl(req: Request, nextPath: string): string {
  const { submissionId } = req.params
  const basePath = `/${submissionId}`

  if (req.query.checkAnswers === 'true') {
    return `${basePath}/check-your-answers`
  }

  return `${basePath}${nextPath}`
}

/**
 * Build back link URL based on context
 */
export function buildBackLink(req: Request, defaultPath: string, cyaPath?: string): string {
  const { submissionId } = req.params
  const cya = req.query.checkAnswers === 'true'

  if (cya && cyaPath) {
    return `/${submissionId}${cyaPath}`
  }

  return `/${submissionId}${defaultPath}`
}
