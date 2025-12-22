import { Response } from 'express'
import Checkin from '../../data/models/checkin'
import { Language } from '../../content'

export interface SubmissionLocals {
  checkin: Checkin
  formData: Record<string, unknown>
  submissionAuthorized?: string
  // Language/i18n helpers from languageMiddleware
  lang: Language
  t: (key: string, fallback?: string) => string
  getContent: <T = unknown>(key: string) => T | undefined
  getNamespace: <T = Record<string, unknown>>(namespace: string) => T
  currentPath: string
  languageToggle: {
    currentLang: Language
    switchUrl: string
    switchLang: Language
    switchLabel: string
  }
}

export type SubmissionResponse = Response<object, SubmissionLocals>
