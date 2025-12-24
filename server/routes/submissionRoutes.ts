import { type RequestHandler, Router } from 'express'
import protectSubmission from '../middleware/submissionMiddleware'
import asyncMiddleware from '../middleware/asyncMiddleware'
import validateFormData from '../middleware/validateFormData'
import {
  personalDetailsSchema,
  mentalHealthSchema,
  assistanceSchema,
  callbackSchema,
  checkAnswersSchema,
} from '../schemas/submissionSchemas'
import { Services } from '../services'

// Import from new modular controllers
import {
  renderIndex,
  handleStart,
  renderVerify,
  handleVerify,
  renderMentalHealth,
  handleMentalHealth,
  renderAssistance,
  handleAssistance,
  renderCallback,
  handleCallback,
  renderVideoInform,
  renderVideoRecord,
  handleVideoVerify,
  renderViewVideo,
  renderCheckAnswers,
  handleSubmission,
  renderConfirmation,
  renderTimeout,
  handleKeepalive,
} from '../controllers/submission'

export default function routes({ esupervisionService }: Services): Router {
  const router = Router({ mergeParams: true })

  // Helper to wrap handlers with async error handling
  const get = (routePath: string | string[], ...handlers: RequestHandler[]) =>
    router.get(routePath, ...handlers.map(handler => asyncMiddleware(handler)))

  const post = (routePath: string | string[], ...handlers: RequestHandler[]) =>
    router.post(routePath, ...handlers.map(handler => asyncMiddleware(handler)))

  // Middleware: Validate submission exists and is in valid state
  router.use(
    asyncMiddleware(async (req, res, next) => {
      const { submissionId } = req.params

      // Inject esupervisionService into res.locals for controllers
      res.locals.esupervisionService = esupervisionService

      const notFound = () => res.render('pages/submission/not-found')
      const expired = () => res.render('pages/submission/expired')

      if (!submissionId) {
        return notFound()
      }

      try {
        const checkinResponse = await esupervisionService.getCheckin(submissionId)
        const { status } = checkinResponse.checkin

        // Allow confirmation page for submitted check-ins
        if (status === 'SUBMITTED' && req.originalUrl.endsWith('/confirmation')) {
          return next()
        }

        if (status === 'EXPIRED') {
          return expired()
        }

        if (status !== 'CREATED') {
          return notFound()
        }

        // Store checkin in locals for controllers
        res.locals.checkin = checkinResponse.checkin
        return next()
      } catch (err) {
        if ((err as { responseStatus?: number }).responseStatus === 404) {
          return notFound()
        }
        throw err
      }
    }),
  )

  // ==========================================
  // PUBLIC ROUTES (no session protection)
  // ==========================================

  // Start page
  get('/', renderIndex)
  post('/start', handleStart)

  // Identity verification
  get('/verify', renderVerify)
  post('/verify', validateFormData(personalDetailsSchema), handleVerify)

  // ==========================================
  // PROTECTED ROUTES (require verified session)
  // ==========================================

  // Questions flow
  get('/questions/mental-health', protectSubmission, renderMentalHealth)
  post('/questions/mental-health', protectSubmission, validateFormData(mentalHealthSchema), handleMentalHealth)

  get('/questions/assistance', protectSubmission, renderAssistance)
  post('/questions/assistance', protectSubmission, validateFormData(assistanceSchema), handleAssistance)

  get('/questions/callback', protectSubmission, renderCallback)
  post('/questions/callback', protectSubmission, validateFormData(callbackSchema), handleCallback)

  // Video flow
  get('/video/inform', protectSubmission, renderVideoInform)
  get('/video/record', protectSubmission, renderVideoRecord)
  get('/video/verify', protectSubmission, handleVideoVerify)
  get('/video/view', protectSubmission, renderViewVideo)

  // Check answers and submit
  get('/check-your-answers', protectSubmission, renderCheckAnswers)
  post('/check-your-answers', protectSubmission, validateFormData(checkAnswersSchema), handleSubmission)

  // Confirmation (public - session may be cleared)
  get('/confirmation', renderConfirmation)

  // ==========================================
  // SESSION MANAGEMENT ROUTES
  // ==========================================

  get('/timeout', renderTimeout)
  get('/keepalive', handleKeepalive)

  return router
}
