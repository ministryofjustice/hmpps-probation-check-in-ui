import { Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import validateFormData from '../middleware/validateFormData'
import requireAuth from '../middleware/checkin/requireAuth'
import auditPageView from '../middleware/auditPageView'
import { checkAnswersSchema } from '../schemas/submissionSchemas'
import { renderCheckYourAnswers, handleSubmission } from '../controllers/pages/check-your-answers'

const router = Router({ mergeParams: true })

router.get(
  '/check-your-answers',
  requireAuth,
  auditPageView('CHECK_YOUR_ANSWERS'),
  asyncMiddleware(renderCheckYourAnswers),
)
router.post('/check-your-answers', requireAuth, validateFormData(checkAnswersSchema), asyncMiddleware(handleSubmission))

export default router
