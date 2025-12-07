import { Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import validateFormData from '../middleware/validateFormData'
import auditPageView from '../middleware/auditPageView'
import { personalDetailsSchema } from '../schemas/submissionSchemas'
import { renderVerify, handleVerify } from '../controllers/pages/verify'

const router = Router({ mergeParams: true })

router.get('/verify', auditPageView('VERIFY'), asyncMiddleware(renderVerify))
router.post('/verify', validateFormData(personalDetailsSchema), asyncMiddleware(handleVerify))

export default router
