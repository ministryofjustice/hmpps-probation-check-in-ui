import { Response, Locals } from 'express'
import Checkin from '../../data/models/checkin'
import { Language } from '../../content'
import { CheckinFormData } from '../../data/models/formData'
import EsupervisionService from '../../services/esupervisionService'

export interface SubmissionLocals extends Locals {
  checkin: Checkin
  formData: CheckinFormData
  submissionAuthorized?: string
  esupervisionService: EsupervisionService
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

export type SubmissionResponse = Response<unknown, SubmissionLocals>
