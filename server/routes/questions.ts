import { Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import validateFormData from '../middleware/validateFormData'
import requireAuth from '../middleware/checkin/requireAuth'
import auditPageView from '../middleware/auditPageView'
import { mentalHealthSchema, assistanceSchema, callbackSchema } from '../schemas/submissionSchemas'
import { renderMentalHealth, handleMentalHealth } from '../controllers/pages/mental-health'
import { renderAssistance, handleAssistance } from '../controllers/pages/assistance'
import { renderCallback, handleCallback } from '../controllers/pages/callback'

const router = Router({ mergeParams: true })

router.get('/questions/mental-health', requireAuth, auditPageView('MENTAL_HEALTH'), asyncMiddleware(renderMentalHealth))
router.post(
  '/questions/mental-health',
  requireAuth,
  validateFormData(mentalHealthSchema),
  asyncMiddleware(handleMentalHealth),
)

router.get('/questions/assistance', requireAuth, auditPageView('ASSISTANCE'), asyncMiddleware(renderAssistance))
router.post('/questions/assistance', requireAuth, validateFormData(assistanceSchema), asyncMiddleware(handleAssistance))

router.get('/questions/callback', requireAuth, auditPageView('CALLBACK'), asyncMiddleware(renderCallback))
router.post('/questions/callback', requireAuth, validateFormData(callbackSchema), asyncMiddleware(handleCallback))

export default router
