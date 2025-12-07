import type { Request, Response, NextFunction } from 'express'
import type { HTTPError } from 'superagent'
import logger from '../logger'
import { services } from './services'
import { generateErrorReference, buildErrorContext, extractApiErrorUuid } from './utils/errorReference'
import { ERROR_CONTENT } from './config/content'

const { auditService } = services()

export default function createErrorHandler(production: boolean) {
  return async (error: HTTPError | Error, req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Generate error reference for user support
    const errorReference = generateErrorReference(req)
    const errorContext = buildErrorContext(req, error, errorReference)

    // Log error with full context
    logger.error(`Error handling request for '${req.originalUrl}'`, {
      errorReference,
      apiErrorUuid: errorContext.apiErrorUuid,
      submissionId: errorContext.submissionId,
      error: error.message,
      stack: error.stack,
    })

    // Audit log the error (no PII - only IDs and error reference)
    try {
      await auditService.logAuditEvent({
        what: 'ERROR_OCCURRED',
        who: 'system',
        subjectId: errorContext.submissionId,
        subjectType: 'CHECKIN',
        correlationId: errorContext.errorReference,
        details: {
          errorReference: errorContext.errorReference,
          apiErrorUuid: errorContext.apiErrorUuid,
          path: errorContext.path,
          method: errorContext.method,
          statusCode: (error as HTTPError).status || 500,
        },
      })
    } catch (auditError) {
      logger.error('Failed to log error to audit service', auditError)
    }

    // Handle authentication errors
    const status = (error as HTTPError).status || 500
    if (status === 401 || status === 403) {
      logger.info('Logging user out due to auth error')
      return res.redirect('/sign-out')
    }

    // Build user-facing error message
    const apiErrorUuid = extractApiErrorUuid(error)
    const message = production ? 'Sorry, there is a problem with the service' : error.message

    res.locals.message = message
    res.locals.errorReference = errorReference
    res.locals.apiErrorUuid = apiErrorUuid
    res.locals.status = status
    res.locals.stack = production ? null : error.stack
    res.locals.content = ERROR_CONTENT

    res.status(status)

    return res.render('pages/error')
  }
}
