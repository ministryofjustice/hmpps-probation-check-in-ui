import { Router } from 'express'
import asyncMiddleware from '../middleware/asyncMiddleware'
import { loadCheckin, validateStatus } from '../middleware/checkin'
import { Services } from '../services'

import checkinIndexRouter from './checkin-index'
import verifyRouter from './verify'
import questionsRouter from './questions'
import videoRouter from './video'
import checkYourAnswersRouter from './check-your-answers'
import sessionRouter from './session'

const createCheckinRoutes = (_services: Services): Router => {
  const router = Router({ mergeParams: true })

  router.use(asyncMiddleware(loadCheckin))
  router.use(asyncMiddleware(validateStatus))

  router.use(checkinIndexRouter)
  router.use(verifyRouter)
  router.use(questionsRouter)
  router.use(videoRouter)
  router.use(checkYourAnswersRouter)
  router.use(sessionRouter)

  return router
}

export default createCheckinRoutes
