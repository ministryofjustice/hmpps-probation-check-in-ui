import { get as getKeypath } from 'lodash'
import loadContentPage from '../utils/contentPageLoader'

// English content
import enCommon from './en/common.json'
import enQuestions from './en/questions.json'
import enVideo from './en/video.json'
import enVerify from './en/verify.json'
import enCheckAnswers from './en/checkAnswers.json'
import enConfirmation from './en/confirmation.json'
import enErrors from './en/errors.json'
import enIndex from './en/index.json'
import enHome from './en/home.json'

// Welsh content
import cyCommon from './cy/common.json'
import cyQuestions from './cy/questions.json'
import cyVideo from './cy/video.json'
import cyVerify from './cy/verify.json'
import cyCheckAnswers from './cy/checkAnswers.json'
import cyConfirmation from './cy/confirmation.json'
import cyErrors from './cy/errors.json'
import cyIndex from './cy/index.json'
import cyHome from './cy/home.json'

// Content pages loaded from HTML files
const enAccessibility = loadContentPage('accessibility', 'en')
const enGuidance = loadContentPage('guidance', 'en')
const enPractitionerGuidance = loadContentPage('practitioner-guidance', 'en')
const enPrivacy = loadContentPage('privacy', 'en')

const cyAccessibility = loadContentPage('accessibility', 'cy')
const cyGuidance = loadContentPage('guidance', 'cy')
const cyPractitionerGuidance = loadContentPage('practitioner-guidance', 'cy')
const cyPrivacy = loadContentPage('privacy', 'cy')

export type Language = 'en' | 'cy'

export const SUPPORTED_LANGUAGES: Language[] = ['en', 'cy']

export const DEFAULT_LANGUAGE: Language = 'en'

const content: Record<Language, Record<string, unknown>> = {
  en: {
    common: enCommon,
    questions: enQuestions,
    video: enVideo,
    verify: enVerify,
    checkAnswers: enCheckAnswers,
    confirmation: enConfirmation,
    errors: enErrors,
    index: enIndex,
    home: enHome,
    accessibility: enAccessibility,
    guidance: enGuidance,
    'practitioner-guidance': enPractitionerGuidance,
    privacy: enPrivacy,
  },
  cy: {
    common: cyCommon,
    questions: cyQuestions,
    video: cyVideo,
    verify: cyVerify,
    checkAnswers: cyCheckAnswers,
    confirmation: cyConfirmation,
    errors: cyErrors,
    index: cyIndex,
    home: cyHome,
    accessibility: cyAccessibility,
    guidance: cyGuidance,
    'practitioner-guidance': cyPractitionerGuidance,
    privacy: cyPrivacy,
  },
}

/**
 * Get translated content by key path
 * @param lang - Language code ('en' or 'cy')
 * @param key - Dot-notation key path (e.g., 'common.back' or 'questions.mentalHealth.title')
 * @param fallback - Optional fallback value if key not found
 * @returns Translated string or fallback
 */
export function t(lang: Language, key: string, fallback?: string): string {
  const value = getKeypath(content[lang], key)

  if (value !== undefined && value !== null) {
    return String(value)
  }

  // Try English as fallback
  if (lang !== 'en') {
    const enValue = getKeypath(content.en, key)
    if (enValue !== undefined && enValue !== null) {
      return String(enValue)
    }
  }

  return fallback ?? key
}

/**
 * Get a content object (for passing to templates)
 * @param lang - Language code
 * @param key - Dot-notation key path
 * @returns Content object or undefined
 */
export function getContent<T = unknown>(lang: Language, key: string): T | undefined {
  return getKeypath(content[lang], key) as T | undefined
}

/**
 * Get all content for a specific namespace
 * @param lang - Language code
 * @param namespace - Content namespace (e.g., 'questions', 'video')
 * @returns Content object for the namespace
 */
export function getNamespace<T = Record<string, unknown>>(lang: Language, namespace: string): T {
  return (content[lang][namespace] as T) ?? ({} as T)
}

/**
 * Check if a language is supported
 * @param lang - Language code to check
 * @returns True if language is supported
 */
export function isValidLanguage(lang: string): lang is Language {
  return SUPPORTED_LANGUAGES.includes(lang as Language)
}

export default content
