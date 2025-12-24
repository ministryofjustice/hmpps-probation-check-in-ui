/* eslint-disable no-param-reassign */
import path from 'path'
import nunjucks from 'nunjucks'
import express from 'express'
import fs from 'fs'
import { get as getKeypath } from 'lodash'
import { format } from 'date-fns/format'
import { isValid, parse, parseISO } from 'date-fns'
import { initialiseName } from './utils'
import config from '../config'
import logger from '../../logger'

import { findError } from '../middleware/validateFormData'
import getUserFriendlyString from './userFriendlyStrings'
import { t as translate, getContent, getNamespace, Language, DEFAULT_LANGUAGE } from '../content'

interface NunjucksContext {
  ctx?: {
    lang?: Language
    formData?: Record<string, unknown>
  }
}

export default function nunjucksSetup(app: express.Express): void {
  app.set('view engine', 'njk')

  app.locals.asset_path = '/assets/'
  app.locals.applicationName = 'Check in with your probation officer'
  app.locals.serviceName = 'Check in with your probation officer'
  app.locals.serviceNamePractitioner = 'Manage probation check ins'
  app.locals.supportEmailAddress = 'checkinwithprobation@justice.gov.uk'

  app.locals.environmentName = config.environmentName
  app.locals.environmentNameColour = config.environmentName === 'PRE-PRODUCTION' ? 'govuk-tag--green' : ''
  let assetManifest: Record<string, string> = {}

  try {
    const assetMetadataPath = path.resolve(__dirname, '../../assets/manifest.json')
    assetManifest = JSON.parse(fs.readFileSync(assetMetadataPath, 'utf8'))
  } catch (e) {
    if (process.env.NODE_ENV !== 'test') {
      logger.error(e, 'Could not read asset manifest file')
    }
  }

  const njkEnv = nunjucks.configure(
    [
      path.join(__dirname, '../../server/views'),
      'node_modules/govuk-frontend/dist/',
      'node_modules/@ministryofjustice/frontend/',
    ],
    {
      autoescape: true,
      express: app,
    },
  )

  // Apply the update gov.uk branding
  njkEnv.addGlobal('govukRebrand', true)

  njkEnv.addFilter('findError', findError)
  njkEnv.addFilter('initialiseName', initialiseName)
  njkEnv.addFilter('assetMap', (url: string) => assetManifest[url] || url)

  njkEnv.addFilter('userFriendlyString', (term: string) => {
    return getUserFriendlyString(term)
  })

  /**
   * Translate a string using the current language from context
   * Usage in templates: {{ 'common.back' | t }} or {{ t('common.back') }}
   */
  njkEnv.addFilter('t', function translateFilter(this: NunjucksContext, key: string, fallback?: string) {
    const lang: Language = this.ctx?.lang ?? DEFAULT_LANGUAGE
    return translate(lang, key, fallback)
  })

  /**
   * Get translated content using the current language
   * For use when res.locals.t is not yet available (e.g., in macros)
   */
  njkEnv.addGlobal('t', function translateGlobal(this: NunjucksContext, key: string, fallback?: string) {
    const lang: Language = this.ctx?.lang ?? DEFAULT_LANGUAGE
    return translate(lang, key, fallback)
  })

  /**
   * Get a content object by key path
   * Usage: {% set content = getContent('questions.mentalHealth') %}
   */
  njkEnv.addGlobal('getContent', function getContentGlobal<T = unknown>(this: NunjucksContext, key: string):
    | T
    | undefined {
    const lang: Language = this.ctx?.lang ?? DEFAULT_LANGUAGE
    return getContent<T>(lang, key)
  })

  /**
   * Get a namespace of content
   * Usage: {% set videoContent = getNamespace('video') %}
   */
  njkEnv.addGlobal('getNamespace', function getNamespaceGlobal<
    T = Record<string, unknown>,
  >(this: NunjucksContext, namespace: string): T {
    const lang: Language = this.ctx?.lang ?? DEFAULT_LANGUAGE
    return getNamespace<T>(lang, namespace)
  })

  /**
   * Translate user-friendly strings with language awareness
   * Tries to get translated version from content, falls back to utility function
   */
  njkEnv.addFilter(
    'userFriendlyStringTranslated',
    function userFriendlyStringTranslated(this: NunjucksContext, term: string, prefix?: string) {
      const lang: Language = this.ctx?.lang ?? DEFAULT_LANGUAGE
      if (prefix) {
        const translated = getContent<string>(lang, `${prefix}.${term}`)
        if (translated) return translated
      }
      return getUserFriendlyString(term)
    },
  )

  njkEnv.addFilter('formatDate', (date: string) => {
    if (!date) {
      return ''
    }
    const d = new Date(date)
    return format(d, 'dd/MM/yyyy')
  })

  njkEnv.addFilter('split', (str: unknown, separator: string = ',') => {
    if (typeof str !== 'string') {
      return str
    }
    const sep = typeof separator === 'string' ? separator : String(separator)
    return str.split(sep).map(item => item.trim())
  })

  /**
   * Merge two objects together
   * Usage: {% set item = item | merge({ key: value }) %}
   */
  njkEnv.addFilter('merge', (obj: Record<string, unknown>, mergeObj: Record<string, unknown>) => {
    return { ...obj, ...mergeObj }
  })

  njkEnv.addFilter('gdsDate', (input?: string | Date | null) => {
    if (!input) return ''

    let d: Date | null = null

    if (input instanceof Date) {
      d = isValid(input) ? input : null
    } else if (typeof input === 'string') {
      const s = input.trim()
      if (!s) return ''

      // ISO-like strings
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        d = parse(s, 'yyyy-MM-dd', new Date())
      } else if (/^\d{4}-\d{2}-\d{2}[T ]/.test(s)) {
        d = parseISO(s)
      } else {
        d = parse(s, 'd/M/yyyy', new Date())
      }
    }

    if (!d || !isValid(d)) {
      try {
        d = new Date(String(input))
      } catch (e) {
        logger.error(e, `Could not parse date -> ${input}`)
        return ''
      }
    }

    if (!d || !isValid(d)) {
      return ''
    }

    return format(d, 'd MMMM yyyy')
  })

  njkEnv.addFilter('gdsDateTime', (date: string) => {
    if (!date) {
      return ''
    }
    const d = new Date(date)
    return format(d, "d MMMM yyyy', ' h:mmaaa")
  })

  njkEnv.addGlobal('checked', function isChecked(this: NunjucksContext, name: string, value: string) {
    if (this.ctx?.formData === undefined) {
      return ''
    }

    const keyPath = !name.match(/[.[]/g) ? `['${name}']` : name
    const storedValue = getKeypath(this.ctx.formData, keyPath)

    if (storedValue === undefined) {
      return ''
    }

    let checked = ''

    if (Array.isArray(storedValue)) {
      if (storedValue.indexOf(value) !== -1) {
        checked = 'checked'
      }
    } else if (storedValue === value) {
      checked = 'checked'
    }
    return checked
  })

  njkEnv.addGlobal('showIfExists', function doesItExist(item: string, answer: string | string[]): string {
    if (typeof answer === 'string') {
      return answer === item ? '' : 'govuk-visually-hidden'
    }

    if (Array.isArray(answer)) {
      return answer.includes(item) ? '' : 'govuk-visually-hidden'
    }

    return ''
  })
}
