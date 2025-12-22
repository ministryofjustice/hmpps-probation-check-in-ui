import { RequestHandler, Request, Response, NextFunction } from 'express'
import { Language, DEFAULT_LANGUAGE, isValidLanguage, t, getContent, getNamespace } from '../content'

const LANG_COOKIE_NAME = 'lang'
const LANG_COOKIE_MAX_AGE = 365 * 24 * 60 * 60 * 1000 // 1 year

declare module 'express-session' {
  interface SessionData {
    lang?: Language
  }
}

declare module 'express' {
  interface Locals {
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
}

/**
 * Extract language from URL prefix (/cy/...)
 */
function getLangFromUrl(path: string): Language | null {
  const match = path.match(/^\/(en|cy)(\/|$)/)
  if (match && isValidLanguage(match[1])) {
    return match[1]
  }
  return null
}

/**
 * Strip language prefix from URL
 */
function stripLangPrefix(path: string): string {
  return path.replace(/^\/(en|cy)(\/|$)/, '/$2').replace(/^\/\//, '/')
}

/**
 * Language middleware - handles language detection, storage, and URL rewriting
 *
 * How it works:
 * 1. If URL has /en/... or /cy/... prefix:
 *    - Set cookie to that language
 *    - Redirect to URL without prefix
 * 2. If URL has no prefix:
 *    - Use cookie value (or default to English)
 *    - Render page in that language
 *
 * This means clicking language toggle (/cy/... or /en/...) sets the cookie
 * and redirects, then subsequent pages use the cookie.
 */
export default function languageMiddleware(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const langFromUrl = getLangFromUrl(req.path)
    const langFromCookie = req.cookies?.[LANG_COOKIE_NAME]

    // If URL has language prefix (/en/... or /cy/...):
    // 1. Set/update the cookie to that language
    // 2. Redirect to the URL without the prefix
    if (langFromUrl) {
      res.cookie(LANG_COOKIE_NAME, langFromUrl, {
        maxAge: LANG_COOKIE_MAX_AGE,
        httpOnly: true,
        sameSite: 'lax',
      })

      if (req.session) {
        req.session.lang = langFromUrl
      }

      const redirectPath = stripLangPrefix(req.originalUrl) || '/'
      return res.redirect(302, redirectPath)
    }

    // No language prefix - use cookie or default to English
    const lang: Language = langFromCookie && isValidLanguage(langFromCookie) ? langFromCookie : DEFAULT_LANGUAGE

    // Store in session for consistency
    if (req.session) {
      req.session.lang = lang
    }

    // Get the clean path for language toggle links
    const currentPath = stripLangPrefix(req.originalUrl)

    // Set up locals for templates
    res.locals.lang = lang
    res.locals.currentPath = currentPath

    // Translation helper bound to current language
    res.locals.t = (key: string, fallback?: string) => t(lang, key, fallback)

    // Content getters bound to current language
    res.locals.getContent = <T = unknown>(key: string) => getContent<T>(lang, key)
    res.locals.getNamespace = <T = Record<string, unknown>>(namespace: string) => getNamespace<T>(lang, namespace)

    // Language toggle data for header
    // Both links use /{lang}/... prefix to trigger the redirect and cookie set
    const switchLang: Language = lang === 'en' ? 'cy' : 'en'
    const switchUrl = `/${switchLang}${currentPath}`
    const switchLabel = switchLang === 'cy' ? 'Cymraeg' : 'English'

    res.locals.languageToggle = {
      currentLang: lang,
      switchUrl,
      switchLang,
      switchLabel,
    }

    return next()
  }
}

/**
 * Helper to generate language-aware URLs
 */
export function localizedUrl(path: string, lang: Language): string {
  const cleanPath = stripLangPrefix(path)
  if (lang === 'cy') {
    return `/cy${cleanPath}`
  }
  return cleanPath
}
