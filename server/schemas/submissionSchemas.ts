import { z } from 'zod'
import createDateSchema from './shared'
import { i18nMessage } from '../utils/i18nValidation'

const dobSchema = createDateSchema({
  who: 'your',
  labelKey: 'submission.verify.dob.label',
  groupPath: 'dob',
  rules: {
    mustBeInPast: true,
  },
})

export const personalDetailsSchema = z
  .object({
    firstName: z.string().min(1, i18nMessage('submission.verify.errors.firstNameRequired')),
    lastName: z.string().min(1, i18nMessage('submission.verify.errors.lastNameRequired')),
  })
  .and(dobSchema)

const validCircumstances = [
  'MENTAL_HEALTH',
  'ALCOHOL',
  'DRUGS',
  'MONEY',
  'HOUSING',
  'EMPLOYMENT_EDU',
  'SUPPORT_SYSTEM',
  'OTHER',
  'NO_HELP',
] as const

const MentalHealthEnum = z
  .enum(['VERY_WELL', 'WELL', 'OK', 'NOT_GREAT', 'STRUGGLING'], {
    error: issue =>
      issue.input === undefined ? i18nMessage('submission.questions.mentalHealth.errors.required') : issue.message,
  })
  .describe('Select how you have been feeling since we last spoke')

export const mentalHealthSchema = z.object({
  mentalHealth: MentalHealthEnum,
  mentalHealthVeryWell: z.string().optional(),
  mentalHealthWell: z.string().optional(),
  mentalHealthOk: z.string().optional(),
  mentalHealthNotGreat: z.string().optional(),
  mentalHealthStruggling: z.string().optional(),
})

export const assistanceSchema = z.object({
  assistance: z.preprocess(
    val => {
      if (typeof val === 'string') return [val]
      if (Array.isArray(val)) return val
      return []
    },
    z.array(z.enum(validCircumstances)).min(1, i18nMessage('submission.questions.assistance.errors.required')),
  ),
})

export const additionalAnswerSchema = z.object({
  additionalAnswer: z.string().trim().min(1, i18nMessage('submission.questions.additional.errors.required')),
})

export const checkAnswersSchema = z
  .object({
    checkAnswers: z
      .enum(['CONFIRM'], {
        error: issue =>
          issue.input === undefined ? i18nMessage('submission.checkAnswers.errors.required') : issue.message,
      })
      .describe('Confirm your details are correct'),
  })
  .required()
