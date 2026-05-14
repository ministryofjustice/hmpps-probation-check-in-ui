import type { TFunction } from 'i18next'
import { sentenceCase } from './utils'

const I18N_PREFIX = '__i18n__:'

type I18nPayload = {
  key: string
  params?: Record<string, unknown>
}

export function i18nMessage(key: string, params?: Record<string, unknown>): string {
  return `${I18N_PREFIX}${JSON.stringify({ key, params })}`
}

function parsePayload(message: string): I18nPayload | null {
  if (!message.startsWith(I18N_PREFIX)) return null
  try {
    return JSON.parse(message.slice(I18N_PREFIX.length)) as I18nPayload
  } catch {
    return null
  }
}

function joinList(items: string[], conjunction: string): string {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`
  return `${items.slice(0, -1).join(', ')} ${conjunction} ${items[items.length - 1]}`
}

export function resolveValidationMessage(message: string, t: TFunction): string {
  const payload = parsePayload(message)
  if (!payload) {
    // Plain string: try as translation key, otherwise pass through.
    return t(message, { defaultValue: message }) as string
  }

  const params: Record<string, unknown> = { ...(payload.params || {}) }

  if (typeof params.labelKey === 'string') {
    const label = t(params.labelKey, { defaultValue: params.labelKey }) as string
    params.label = label
    params.labelSentence = sentenceCase(label)
    delete params.labelKey
  }

  if (typeof params.whoKey === 'string') {
    params.who = t(params.whoKey, { defaultValue: '' }) as string
    delete params.whoKey
  }

  if (Array.isArray(params.partKeys)) {
    const translatedParts = (params.partKeys as string[]).map(
      partKey => t(partKey, { defaultValue: partKey }) as string,
    )
    const conjunction = t('common.and', { defaultValue: 'and' }) as string
    params.parts = joinList(translatedParts, conjunction)
    params.count = translatedParts.length
    delete params.partKeys
  }

  return t(payload.key, params) as string
}
