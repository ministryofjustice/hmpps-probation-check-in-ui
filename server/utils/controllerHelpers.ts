import { Request } from 'express'

export interface BackLinkParams {
  cya?: boolean
  submissionId: string
}

/**
 * Extract submissionId from request params
 */
export const getSubmissionId = (req: Request): string => req.params.submissionId

/**
 * Check if request is in "check your answers" mode
 */
export const isCheckAnswersMode = (req: Request): boolean => req.query.checkAnswers === 'true'

/**
 * Get standard parameters for back link generation
 */
export const getBackLinkParams = (req: Request): BackLinkParams => ({
  submissionId: getSubmissionId(req),
  cya: isCheckAnswersMode(req),
})

/**
 * Build back link based on check-your-answers mode
 * @param submissionId - The checkin submission ID
 * @param defaultPath - Path to return to when not in CYA mode (without submissionId prefix)
 * @param cya - Whether in check-your-answers mode
 */
export const buildBackLink = (submissionId: string, defaultPath: string, cya: boolean): string => {
  return cya ? `/${submissionId}/check-your-answers` : `/${submissionId}${defaultPath}`
}
