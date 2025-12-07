import { Request } from 'express'
import { randomUUID } from 'crypto'

/**
 * Generate a unique error reference ID for user support
 * Format: ERR-{requestId}-{timestamp}
 */
export const generateErrorReference = (req: Request): string => {
  const requestId = req.id || randomUUID()
  const timestamp = Date.now()
  return `ERR-${requestId}-${timestamp}`
}

/**
 * Extract API error UUID from error object if present
 * Many external APIs return error UUIDs in their error responses
 */
export const extractApiErrorUuid = (error: unknown): string | undefined => {
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, unknown>
    // Check common patterns for API error UUIDs
    return (
      (errorObj.errorId as string) ||
      (errorObj.errorUuid as string) ||
      (errorObj.uuid as string) ||
      (errorObj.correlationId as string) ||
      undefined
    )
  }
  return undefined
}

/**
 * Build error context for logging and display
 */
export interface ErrorContext {
  errorReference: string
  apiErrorUuid?: string
  submissionId?: string
  path: string
  method: string
  userAgent?: string
}

export const buildErrorContext = (req: Request, error: unknown, errorReference: string): ErrorContext => {
  return {
    errorReference,
    apiErrorUuid: extractApiErrorUuid(error),
    submissionId: req.params.submissionId,
    path: req.originalUrl,
    method: req.method,
    userAgent: req.headers['user-agent'],
  }
}
