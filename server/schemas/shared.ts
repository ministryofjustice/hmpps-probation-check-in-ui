import { z } from 'zod'
import { isExists, isFuture, isPast, isToday } from 'date-fns'
import { i18nMessage } from '../utils/i18nValidation'

type Who = 'your' | 'their'

type DateSchemaOptions<P extends string> = {
  prefix?: P
  who?: Who
  labelKey: string
  groupPath?: string
  rules?: {
    mustBeInPast?: boolean
    mustBeInFuture?: boolean
    allowToday?: boolean
  }
}

const PART_KEY = {
  day: 'submission.errors.date.parts.day',
  month: 'submission.errors.date.parts.month',
  year: 'submission.errors.date.parts.year',
  year4digits: 'submission.errors.date.parts.year4digits',
} as const

const WHO_KEY = {
  your: 'submission.errors.date.who.your',
  their: 'submission.errors.date.who.their',
} as const

export default function createDateSchema({
  prefix,
  who = 'your',
  labelKey,
  groupPath = prefix,
  rules,
}: DateSchemaOptions<string>) {
  const dayKey = prefix ? `${prefix}Day` : 'day'
  const monthKey = prefix ? `${prefix}Month` : 'month'
  const yearKey = prefix ? `${prefix}Year` : 'year'

  return z
    .object({
      [dayKey]: z.string().trim(),
      [monthKey]: z.string().trim(),
      [yearKey]: z.string().trim(),
    })
    .superRefine((data, ctx) => {
      const dataCopy: Record<string, string> = { ...data }

      const dayRaw = dataCopy[dayKey]
      const monthRaw = dataCopy[monthKey]
      const yearRaw = dataCopy[yearKey]

      const allEmpty = !dayRaw && !monthRaw && !yearRaw
      if (allEmpty) {
        ctx.addIssue({
          code: 'custom',
          message: i18nMessage('submission.errors.date.allMissing', {
            whoKey: WHO_KEY[who],
            labelKey,
          }),
          path: [groupPath],
        })
        return
      }

      const isDigits = (s: string) => /^\d+$/.test(s)
      const nonNumeric: Array<string> = []
      if (dayRaw && !isDigits(dayRaw)) nonNumeric.push(dayKey)
      if (monthRaw && !isDigits(monthRaw)) nonNumeric.push(monthKey)
      if (yearRaw && !isDigits(yearRaw)) nonNumeric.push(yearKey)

      if (nonNumeric.length) {
        if (nonNumeric.length === 1) {
          const which = nonNumeric[0]
          let key = 'submission.errors.date.yearMustBeNumber'
          if (which === dayKey) key = 'submission.errors.date.dayMustBeNumber'
          else if (which === monthKey) key = 'submission.errors.date.monthMustBeNumber'
          ctx.addIssue({
            code: 'custom',
            message: i18nMessage(key),
            path: [which],
          })
        } else {
          ctx.addIssue({
            code: 'custom',
            message: i18nMessage('submission.errors.date.allMustBeNumbers', { labelKey }),
            path: ['dob'],
          })
        }
        return
      }

      const missingParts: Array<keyof typeof PART_KEY> = []
      if (!dayRaw) missingParts.push('day')
      if (!monthRaw) missingParts.push('month')
      if (!yearRaw) {
        missingParts.push('year')
      } else if (yearRaw.length !== 4) {
        missingParts.push('year4digits')
      }

      function getPathForMissingParts(mp: typeof missingParts): string[] {
        if (mp.length === 1) {
          switch (mp[0]) {
            case 'day':
              return [dayKey]
            case 'month':
              return [monthKey]
            default:
              return [yearKey]
          }
        }
        return [groupPath]
      }

      if (missingParts.length > 0) {
        const onlyYear4Digits = missingParts.length === 1 && missingParts[0] === 'year4digits'
        if (onlyYear4Digits) {
          ctx.addIssue({
            code: 'custom',
            message: i18nMessage('submission.errors.date.yearMustBe4'),
            path: [yearKey],
          })
        } else {
          ctx.addIssue({
            code: 'custom',
            message: i18nMessage('submission.errors.date.missingParts', {
              labelKey,
              partKeys: missingParts.map(p => PART_KEY[p]),
            }),
            path: getPathForMissingParts(missingParts),
          })
        }
        return
      }

      const day = parseInt(dayRaw, 10)
      const month = parseInt(monthRaw, 10)
      const year = parseInt(yearRaw, 10)

      const dayInvalid = day < 1 || day > 31
      const monthInvalid = month < 1 || month > 12
      const yearInvalid = year < 1900 || year > 2100

      const monthIndex = month - 1
      let path: string[] | null = null

      if (dayInvalid && !monthInvalid) {
        path = [dayKey]
      } else if (!dayInvalid && monthInvalid) {
        path = [monthKey]
      } else if (dayInvalid && monthInvalid) {
        path = [groupPath]
      } else if (yearInvalid || !isExists(year, monthIndex, day)) {
        path = [groupPath]
      }

      if (path) {
        ctx.addIssue({
          code: 'custom',
          message: i18nMessage('submission.errors.date.mustBeReal', { labelKey }),
          path,
        })
        return
      }

      const candidate = new Date(year, monthIndex, day)

      if (rules?.mustBeInFuture && rules?.allowToday) {
        if (isFuture(candidate) || isToday(candidate)) {
          return
        }
        ctx.addIssue({
          code: 'custom',
          message: i18nMessage('submission.errors.date.mustBeFutureOrToday', { labelKey }),
          path: [groupPath],
        })
      }

      if (rules?.mustBeInFuture) {
        if (!isFuture(candidate)) {
          ctx.addIssue({
            code: 'custom',
            message: i18nMessage('submission.errors.date.mustBeFuture', { labelKey }),
            path: [groupPath],
          })
        }
      }

      if (rules?.mustBeInPast) {
        if (!isPast(candidate)) {
          ctx.addIssue({
            code: 'custom',
            message: i18nMessage('submission.errors.date.mustBePast', { labelKey }),
            path: [groupPath],
          })
        }
      }
    })
}
