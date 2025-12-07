import { RequestHandler } from 'express'
import logger from '../../logger'
import { services } from '../services'

/**
 * Audit middleware to log page views
 * NO PII - only page name and submissionId
 */
const auditPageView = (pageName: string): RequestHandler => {
  return async (req, res, next) => {
    const { submissionId } = req.params
    const { auditService } = services()

    try {
      await auditService.logAuditEvent({
        what: `PAGE_VIEW_${pageName.toUpperCase()}`,
        who: 'user',
        subjectId: submissionId,
        subjectType: 'CHECKIN',
        correlationId: req.id,
        details: {
          page: pageName,
          checkAnswersMode: req.query.checkAnswers === 'true',
        },
      })
    } catch (error) {
      // Don't block request if audit fails
      logger.error(`Failed to audit page view for ${pageName}`, error)
    }

    next()
  }
}

export default auditPageView
