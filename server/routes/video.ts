import { Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import requireAuth from '../middleware/checkin/requireAuth'
import auditPageView from '../middleware/auditPageView'
import { renderVideoInform, renderVideoRecord, handleVideoVerify, renderVideoView } from '../controllers/pages/video'

const router = Router({ mergeParams: true })

router.get('/video/inform', requireAuth, auditPageView('VIDEO_INFORM'), asyncMiddleware(renderVideoInform))
router.get('/video/record', requireAuth, auditPageView('VIDEO_RECORD'), asyncMiddleware(renderVideoRecord))
router.get('/video/verify', requireAuth, auditPageView('VIDEO_VERIFY'), asyncMiddleware(handleVideoVerify))
router.get('/video/view', requireAuth, auditPageView('VIDEO_VIEW'), asyncMiddleware(renderVideoView))

export default router
