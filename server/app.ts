import express from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import nunjucksSetup from './utils/nunjucksSetup'
import errorHandler from './errorHandler'
import { appInsightsMiddleware } from './utils/azureAppInsights'

import setUpAuthentication from './middleware/setUpAuthentication'
import setUpCsrf from './middleware/setUpCsrf'
import setUpHealthChecks from './middleware/setUpHealthChecks'
import setUpStaticResources from './middleware/setUpStaticResources'
import setUpWebRequestParsing from './middleware/setupRequestParsing'
import setUpWebSession from './middleware/setUpWebSession'
import setUpWebSecurity from './middleware/setUpWebSecurity'
import populateValidationErrors from './middleware/populateValidationErrors'
import storeFormDataInSession from './middleware/storeFormDataInSession'
import languageMiddleware from './middleware/languageMiddleware'
import routes from './routes'
import submissionRoutes from './routes/submissionRoutes'
import featureFlags from './middleware/featureFlags'

import type { Services } from './services'
import restrictToUK from './middleware/restrictToUK'

export default function createApp(services: Services): express.Application {
  const app = express()

  app.set('json spaces', 2)
  app.set('trust proxy', true)
  app.set('port', process.env.PORT || 3000)

  // don't send X-Powered-By header
  app.disable('x-powered-by')

  // ==========================================
  // GLOBAL MIDDLEWARE (all routes)
  // ==========================================

  app.use(appInsightsMiddleware())
  app.use(setUpHealthChecks(services.applicationInfo))
  app.use(setUpWebSecurity())
  app.use(setUpWebSession())
  app.use(setUpWebRequestParsing())
  app.use(setUpStaticResources())

  app.use(cookieParser(`esCookieSecret${process.env.COOKIE_SECRET}`))
  app.use(featureFlags())

  // Language detection and translation setup
  app.use(languageMiddleware())

  nunjucksSetup(app)
  app.use(setUpAuthentication())
  app.use(setUpCsrf())

  // ==========================================
  // STATIC ROUTES (no form processing middleware)
  // Routes: /, /privacy-notice, /accessibility, /guidance, etc.
  // ==========================================

  app.use(routes())

  // ==========================================
  // SUBMISSION ROUTES (with form processing middleware)
  // Routes: /:submissionId/*
  // ==========================================

  // Create a sub-router for submission routes with form-specific middleware
  const submissionRouter = express.Router({ mergeParams: true })

  // Form processing middleware - only for submission routes
  submissionRouter.use(bodyParser.json())
  submissionRouter.use(storeFormDataInSession())
  submissionRouter.use(populateValidationErrors())

  // UK restriction - only for submission routes
  submissionRouter.use(restrictToUK)

  // Mount submission routes
  submissionRouter.use('/', submissionRoutes(services))

  // Apply submission router to /:submissionId paths
  app.use('/:submissionId', submissionRouter)

  // Welsh language routes - redirect /cy/:submissionId/* to use same router
  // The language middleware will strip /cy/ and set the language
  app.use('/cy/:submissionId', submissionRouter)

  // ==========================================
  // ERROR HANDLING
  // ==========================================

  app.use((req, res) => {
    res.status(404).render('pages/not-found')
  })

  app.use(errorHandler(process.env.NODE_ENV === 'production'))

  return app
}
