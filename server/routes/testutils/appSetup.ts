import express, { Express } from 'express'
import { NotFound } from 'http-errors'

import { randomUUID } from 'crypto'
import routes from '../index'
import nunjucksSetup from '../../utils/nunjucksSetup'
import errorHandler from '../../errorHandler'
import type { Services } from '../../services'
import AuditService from '../../services/auditService'
import HmppsAuditClient from '../../data/hmppsAuditClient'
import setUpWebSession from '../../middleware/setUpWebSession'

jest.mock('../../services/auditService')
jest.mock('../../data/hmppsAuditClient')

export const flashProvider = jest.fn()

/**
 * Create a mock AuditService for testing.
 * Since jest.mock() replaces the constructor, we provide a mock HmppsAuditClient.
 */
function createMockAuditService(): jest.Mocked<AuditService> {
  const MockedHmppsAuditClient = HmppsAuditClient as jest.MockedClass<typeof HmppsAuditClient>
  const mockAuditClient = new MockedHmppsAuditClient({
    queueUrl: 'mock-queue-url',
    region: 'mock-region',
    serviceName: 'mock-service',
    enabled: false,
  })
  return new AuditService(mockAuditClient) as jest.Mocked<AuditService>
}

function appSetup(services: Services, production: boolean): Express {
  const app = express()

  app.set('view engine', 'njk')

  nunjucksSetup(app)
  app.use(setUpWebSession())
  app.use((req, res, next) => {
    req.flash = flashProvider
    next()
  })
  app.use((req, res, next) => {
    req.id = randomUUID()
    next()
  })
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  app.use(routes())
  app.use((req, res, next) => next(new NotFound()))
  app.use(errorHandler(production))

  return app
}

export function appWithAllRoutes({
  production = false,
  services = {
    auditService: createMockAuditService(),
  },
}: {
  production?: boolean
  services?: Partial<Services>
}): Express {
  return appSetup(services as Services, production)
}
