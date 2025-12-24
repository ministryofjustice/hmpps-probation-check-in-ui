import { Request, Response, NextFunction, RequestHandler } from 'express'
import { isVerifyFormData } from '../data/models/formData'

export default function populateValidationErrors(): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    const validationErrors = req.flash('validationErrors')[0]
    if (validationErrors) {
      res.locals.validationErrors = JSON.parse(validationErrors)
    }

    // Restore form body on validation failure (preserves user input)
    const formBody = req.flash('formBody')[0]
    if (formBody) {
      const parsedFormBody = JSON.parse(formBody)

      // Route to appropriate locals field based on form type
      if (isVerifyFormData(parsedFormBody)) {
        res.locals.verifyFormData = parsedFormBody
      } else {
        res.locals.formData = { ...res.locals.formData, ...parsedFormBody }
      }
    }

    next()
  }
}
