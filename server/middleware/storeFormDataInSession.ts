import { RequestHandler, Request, Response, NextFunction } from 'express'
import {
  CheckinFormData,
  isCheckinFormDataKey,
  createEmptyFormData,
  setFormDataValue,
  deleteFormDataValue,
} from '../data/models/formData'

/**
 * Middleware to store form data in session and expose it via res.locals.
 *
 * This middleware:
 * 1. Initializes formData in session if not present
 * 2. Processes incoming form data from req.body
 * 3. Handles checkbox unchecking patterns (_unchecked values)
 * 4. Only accepts known form data keys (ignores unknown fields)
 * 5. Copies session formData to res.locals for template access
 */
export default function storeFormDataInSession(): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Initialize session formData if not present
    const formData: CheckinFormData = req.session.formData ?? createEmptyFormData()
    req.session.formData = formData
    res.locals.formData = createEmptyFormData()

    if (req.body) {
      Object.keys(req.body).forEach(key => {
        // Skip private/hidden fields (starting with underscore)
        if (key.startsWith('_')) {
          return
        }

        // Only process known form data keys for type safety
        if (!isCheckinFormDataKey(key)) {
          return
        }

        let val = req.body[key]

        // Delete values when users unselect checkboxes
        if (val === '_unchecked') {
          deleteFormDataValue(formData, key)
          return
        }

        // Remove _unchecked from arrays of checkboxes
        if (Array.isArray(val)) {
          val = val.filter((item: string) => item !== '_unchecked')
        }

        setFormDataValue(formData, key, val)
      })
    }

    // Copy session formData to res.locals
    Object.assign(res.locals.formData, req.session.formData)

    next()
  }
}
