import { z } from 'zod'
import { i18nMessage } from '../utils/i18nValidation'

const feedbackFormSchema = z.object({
  howEasy: z.enum(['veryEasy', 'easy', 'neitherEasyOrDifficult', 'difficult', 'veryDifficult'], {
    error: i18nMessage('public.feedback.provide.howEasy.error'),
  }),
  gettingSupport: z.enum(['yes', 'no']).optional(),
  improvements: z.union([z.string(), z.array(z.string())]).optional(),
})

export default feedbackFormSchema