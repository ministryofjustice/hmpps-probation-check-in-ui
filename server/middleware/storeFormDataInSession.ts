import { RequestHandler, Request, Response, NextFunction } from 'express'

export default function storeFormDataInSession(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    // Guard against undefined session
    if (!req.session) {
      next(new Error('Session not initialized'))
      return
    }

    if (!req.session.formData) {
      req.session.formData = {}
    }
    res.locals.formData = {}

    if (req.body) {
      Object.keys(req.body).forEach(i => {
        if (i.indexOf('_') === 0) {
          return
        }

        let val = req.body[i]

        // Delete values when users unselect checkboxes
        if (val === '_unchecked') {
          delete req.session.formData[i]
          return
        }

        // Remove _unchecked from arrays of checkboxes
        if (Array.isArray(val)) {
          val = val.filter((item: string) => item !== '_unchecked')
        }

        req.session.formData[i] = val
      })
    }

    Object.assign(res.locals.formData || {}, req.session.formData)

    next()
  }
}
