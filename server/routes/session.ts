import { Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import { renderTimeout, handleKeepalive } from '../controllers/pages/session'
import renderConfirmation from '../controllers/pages/confirmation'

const router = Router({ mergeParams: true })

router.get('/timeout', asyncMiddleware(renderTimeout))
router.get('/keepalive', asyncMiddleware(handleKeepalive))
router.get('/confirmation', asyncMiddleware(renderConfirmation))

export default router
