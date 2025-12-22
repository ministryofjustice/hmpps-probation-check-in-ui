import { CheckinFormData } from '../../data/models/formData'

export declare module 'express-session' {
  // Declare that the session will potentially contain these additional fields
  interface SessionData {
    returnTo: string
    nowInMinutes: number
    submissionAuthorized?: string
    formData?: CheckinFormData | null
  }
}

export declare global {
  namespace Express {
    interface User {
      username: string
      token: string
      authSource: string
    }

    interface Request {
      verified?: boolean
      id: string

      flash(type: string, message: string | ErrorMessages | Array<ErrorSummary> | Record<string, unknown>): number

      logout(done: (err: unknown) => void): void
    }

    interface Locals {
      user: LoggedInUser
      formData?: CheckinFormData | null
    }
  }
}
