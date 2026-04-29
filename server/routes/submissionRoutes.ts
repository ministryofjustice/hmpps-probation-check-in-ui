import { type RequestHandler, Router } from 'express'
import protectSubmission from '../middleware/submissionMiddleware'
import asyncMiddleware from '../middleware/asyncMiddleware'
import validateFormData from '../middleware/validateFormData'
import {
  handleStart,
  handleRedirect,
  handleVerify,
  handleSubmission,
  handleVideoVerify,
  renderAssistance,
  renderQuestionsMentalHealth,
  renderCheckAnswers,
  renderConfirmation,
  renderIndex,
  renderVerify,
  renderVideoInform,
  renderVideoRecord,
  renderViewVideo,
  handleAssistance,
  handleMentalHealth,
  renderAdditionalQuestion,
  handleAdditionalQuestion,
} from '../controllers/submissionController'
import {
  renderLivenessIndex,
  renderLivenessInform,
  renderLivenessRecord,
  renderFallbackInform,
  renderFallbackRecord,
  handleLivenessVerify,
  renderLivenessView,
  renderLivenessCheckAnswers,
  getLivenessSession,
  getLivenessCredentials,
  getSnapshotUploadUrl,
} from '../controllers/livenessController'

import {
  personalDetailsSchema,
  mentalHealthSchema,
  assistanceSchema,
  checkAnswersSchema,
  additionalAnswerSchema,
} from '../schemas/submissionSchemas'

import { Services } from '../services'
import { defaultFlags } from '../utils/flags'
import logger from '../../logger'

export default function routes({ esupervisionService }: Services): Router {
  const router = Router({ mergeParams: true })
  const get = (routePath: string | string[], ...handlers: RequestHandler[]) =>
    router.get(routePath, ...handlers.map(handler => asyncMiddleware(handler)))

  // all submission routes require a valid submission
  // fetch from the API and return a 404 if the submission doesn't exist
  router.use(
    asyncMiddleware(async (req, res, next) => {
      const { submissionId } = req.params
      const notFound = () => {
        res.render('pages/submission/not-found')
      }
      const expired = () => {
        res.render('pages/submission/expired')
      }

      if (submissionId) {
        // lookup submission from the API
        try {
          const checkinResponse = await esupervisionService.getCheckin(submissionId)
          if (checkinResponse.checkin.status === 'SUBMITTED' && req.originalUrl.endsWith('/confirmation')) {
            next()
          } else if (checkinResponse.checkin.status === 'EXPIRED') {
            expired()
          } else if (checkinResponse.checkin.status !== 'CREATED') {
            notFound()
          } else {
            res.locals.checkin = checkinResponse.checkin
            next()
          }
        } catch (err) {
          if (err.responseStatus === 404) {
            notFound()
          } else {
            throw err
          }
        }
      } else {
        notFound()
      }
    }),
  )

  router.post('/start', handleStart)

  get('/', defaultFlags.faceLiveness ? renderLivenessIndex : renderIndex)
  get('/verify', renderVerify)
  router.post('/verify', validateFormData(personalDetailsSchema), handleVerify)

  get('/questions/mental-health', protectSubmission, renderQuestionsMentalHealth)
  router.post('/questions/mental-health', validateFormData(mentalHealthSchema), handleRedirect('/questions/assistance'))
  router.post('/questions/mental-health', protectSubmission, validateFormData(mentalHealthSchema), handleMentalHealth)
  get('/questions/assistance', protectSubmission, renderAssistance)
  router.post('/questions/assistance', protectSubmission, validateFormData(assistanceSchema), handleAssistance)

  get('/questions/additional/:questionIndex', protectSubmission, renderAdditionalQuestion)
  router.post(
    '/questions/additional/:questionIndex',
    protectSubmission,
    validateFormData(additionalAnswerSchema),
    handleAdditionalQuestion,
  )

  get('/video/inform', protectSubmission, renderVideoInform)
  get('/video/record', protectSubmission, renderVideoRecord)
  get('/video/verify', protectSubmission, handleVideoVerify)
  get('/video/view', protectSubmission, renderViewVideo)

  // Dev-only shortcut: bookmark /:submissionId/liveness/dev-skip to bypass identity verification
  // and security questions, jumping straight to the liveness start screen.
  if (process.env.NODE_ENV !== 'production') {
    get('/liveness/dev-skip', (req, res) => {
      const { submissionId } = req.params
      logger.info(`DEV: skipping identity verification for submissionId ${submissionId}`)
      req.session.submissionAuthorized = submissionId
      req.session.save(() => res.redirect(`/${submissionId}/liveness/record`))
    })
  }

  get('/liveness/inform', protectSubmission, renderLivenessInform)
  get('/liveness/record', protectSubmission, renderLivenessRecord)
  get('/liveness/verify', protectSubmission, handleLivenessVerify)
  get('/liveness/fallback-inform', protectSubmission, renderFallbackInform)
  get('/liveness/fallback-record', protectSubmission, renderFallbackRecord)
  get('/liveness/view', protectSubmission, renderLivenessView)
  get('/liveness/check-your-answers', protectSubmission, renderLivenessCheckAnswers)
  router.post('/liveness/check-your-answers', protectSubmission, validateFormData(checkAnswersSchema), handleSubmission)
  get('/liveness/session', protectSubmission, getLivenessSession)
  get('/liveness/credentials', protectSubmission, getLivenessCredentials)
  get('/liveness/upload-url', protectSubmission, getSnapshotUploadUrl)

  get('/check-your-answers', protectSubmission, renderCheckAnswers)
  router.post('/check-your-answers', protectSubmission, validateFormData(checkAnswersSchema), handleSubmission)

  get('/confirmation', renderConfirmation)

  // Session management routes

  // Timeout route to handle session expiration
  get('/timeout', (req, res) => {
    const { submissionId } = req.params
    logger.info(`User session timed out for submissionId ${submissionId}`)
    req.session.submissionAuthorized = null
    res.render('pages/submission/timeout', { submissionId })
  })

  // Keepalive route for session management
  get('/keepalive', (req, res) => {
    res.json({ status: 'OK' })
  })

  return router
}
