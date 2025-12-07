import { Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import auditPageView from '../middleware/auditPageView'
import { renderIndex, handleStart } from '../controllers/pages/index'

const router = Router({ mergeParams: true })

router.get('/', auditPageView('CHECKIN_INDEX'), asyncMiddleware(renderIndex))
router.post('/start', asyncMiddleware(handleStart))

export default router
