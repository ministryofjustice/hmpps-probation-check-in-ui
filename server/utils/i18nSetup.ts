import path from 'path'
import i18next, { type i18n } from 'i18next'
import Backend from 'i18next-fs-backend'
import * as middleware from 'i18next-http-middleware'

export const SUPPORTED_LANGUAGES = ['en', 'cy'] as const
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]
export const LANGUAGE_COOKIE = 'lang'

let initialised: Promise<i18n> | null = null

export function initI18n(): Promise<i18n> {
  if (initialised) return initialised

  initialised = i18next
    .use(Backend)
    .use(middleware.LanguageDetector)
    .init({
      supportedLngs: [...SUPPORTED_LANGUAGES],
      fallbackLng: 'en',
      preload: [...SUPPORTED_LANGUAGES],
      ns: ['translation'],
      defaultNS: 'translation',
      backend: {
        loadPath: path.join(__dirname, '../../server/locales/{{lng}}/{{ns}}.json'),
      },
      detection: {
        order: ['cookie'],
        lookupCookie: LANGUAGE_COOKIE,
        caches: [],
      },
      interpolation: {
        escapeValue: false,
      },
      returnEmptyString: false,
    })
    .then(() => i18next)

  return initialised
}

export { i18next, middleware }
