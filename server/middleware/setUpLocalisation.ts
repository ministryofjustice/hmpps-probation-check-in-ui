import { Request, Response, NextFunction, RequestHandler, Router } from 'express'
import {
  initI18n,
  i18next,
  middleware,
  LANGUAGE_COOKIE,
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
} from '../utils/i18nSetup'
import config from '../config'
import { trackEvent } from '../utils/azureAppInsights'
import logger from '../../logger'

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000

function isSupported(value: unknown): value is SupportedLanguage {
  return typeof value === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(value)
}

function buildRedirectUrl(req: Request): string {
  const url = new URL(req.originalUrl, 'http://placeholder')
  url.searchParams.delete('lang')
  const queryString = url.searchParams.toString()
  const target = url.pathname + (queryString ? `?${queryString}` : '')
  return target || '/'
}

const handleLanguageQuery: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const requested = req.query.lang
  if (typeof requested !== 'string') {
    next()
    return
  }

  if (isSupported(requested)) {
    const previousLanguage = req.cookies?.[LANGUAGE_COOKIE] ?? 'none'

    res.cookie(LANGUAGE_COOKIE, requested, {
      maxAge: ONE_YEAR_MS,
      httpOnly: true,
      sameSite: 'lax',
      secure: config.https,
      signed: false,
    })

    // Structured event for AppInsights
    const switched = previousLanguage !== requested
    trackEvent('LanguageSwitch', {
      language: requested,
      previousLanguage,
      switched: String(switched),
    })

    // More readable line for the logs
    if (switched) {
      logger.info(`Language switched from ${previousLanguage} to ${requested}`)
    }
  }

  res.redirect(buildRedirectUrl(req))
}

const exposeLocals: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const language = req.language || 'en'
  res.locals.t = req.t
  res.locals.lang = language
  res.locals.htmlLang = language

  const url = new URL(req.originalUrl, 'http://placeholder')
  url.searchParams.delete('lang')
  const remaining = url.searchParams.toString()
  const basePath = url.pathname + (remaining ? `?${remaining}` : '')
  const separator = remaining ? '&' : '?'
  res.locals.languageUrls = {
    en: `${basePath}${separator}lang=en`,
    cy: `${basePath}${separator}lang=cy`,
  }

  next()
}

export default function setUpLocalisation(): Router {
  const router = Router()

  const ready = initI18n()

  router.use(async (_req, _res, next) => {
    try {
      await ready
      next()
    } catch (err) {
      next(err)
    }
  })

  router.use(handleLanguageQuery)
  router.use(middleware.handle(i18next))
  router.use(exposeLocals)

  return router
}
