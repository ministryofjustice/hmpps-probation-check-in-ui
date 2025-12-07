import { Request, Response, NextFunction, RequestHandler } from 'express'
import logger from '../../logger'

export default function populateValidationErrors(): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    const validationErrors = req.flash('validationErrors')[0]
    if (validationErrors) {
      try {
        res.locals.validationErrors = JSON.parse(validationErrors)
      } catch (error) {
        logger.error('Failed to parse validation errors from flash', { validationErrors, error })
        // Continue without validation errors rather than crashing
        res.locals.validationErrors = null
      }
    }
    next()
  }
}
