import type { Request, Response, NextFunction } from 'express'
import { defaultFlags } from '../utils/flags'

const COOKIE_NAME = 'es-feature-flags'
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000 // 7 days

// Flags that can only be set via environment variables, not toggled at runtime
const envOnlyFlags: ReadonlySet<string> = new Set(['faceLiveness'])

export default function featureFlags() {
  return (req: Request, res: Response, next: NextFunction) => {
    const flags = { ...defaultFlags }

    const cookieFlags = (req.signedCookies?.[COOKIE_NAME] || {}) as Record<string, 'on' | 'off'>
    let cookieNeedsCleaning = false
    for (const [key, val] of Object.entries(cookieFlags)) {
      if (envOnlyFlags.has(key)) {
        cookieNeedsCleaning = true
      } else if (key in flags) {
        flags[key as keyof typeof flags] = val === 'on'
      }
    }

    const qsOverrides: Record<string, 'on' | 'off'> = {}
    for (const [k, v] of Object.entries(req.query)) {
      // eslint-disable-next-line no-continue
      if (!k.startsWith('es-')) continue
      const flagKey = k.replace(/^es-/, '')
      const val = String(v).toLowerCase()
      if (flagKey in flags && !envOnlyFlags.has(flagKey) && (val === 'on' || val === 'off')) {
        flags[flagKey as keyof typeof flags] = val === 'on'
        qsOverrides[flagKey] = val
      }
    }

    const merged = { ...cookieFlags, ...qsOverrides }

    // Remove env-only flags from the cookie if present
    if (cookieNeedsCleaning) {
      for (const key of envOnlyFlags) {
        delete merged[key]
      }
    }

    if (Object.keys(qsOverrides).length || cookieNeedsCleaning) {
      res.cookie(COOKIE_NAME, merged, {
        httpOnly: true,
        sameSite: 'lax',
        signed: true,
        maxAge: COOKIE_MAX_AGE,
      })
    }

    res.locals.flags = flags
    next()
  }
}
