import AuditService, { Page } from './auditService'
import HmppsAuditClient from '../data/hmppsAuditClient'

jest.mock('../data/hmppsAuditClient')

/**
 * Create a mock HmppsAuditClient for testing.
 * Since jest.mock() replaces the constructor, we don't need real config.
 */
function createMockAuditClient(): jest.Mocked<HmppsAuditClient> {
  const MockedClass = HmppsAuditClient as jest.MockedClass<typeof HmppsAuditClient>
  // The mocked constructor accepts any arguments since the real implementation is replaced
  return new MockedClass({
    queueUrl: 'mock-queue-url',
    region: 'mock-region',
    serviceName: 'mock-service',
    enabled: false,
  }) as jest.Mocked<HmppsAuditClient>
}

describe('Audit service', () => {
  let hmppsAuditClient: jest.Mocked<HmppsAuditClient>
  let auditService: AuditService

  beforeEach(() => {
    hmppsAuditClient = createMockAuditClient()
    auditService = new AuditService(hmppsAuditClient)
  })

  describe('logAuditEvent', () => {
    it('sends audit message using audit client', async () => {
      await auditService.logAuditEvent({
        what: 'AUDIT_EVENT',
        who: 'user1',
        subjectId: 'subject123',
        subjectType: 'exampleType',
        correlationId: 'request123',
        details: { extraDetails: 'example' },
      })

      expect(hmppsAuditClient.sendMessage).toHaveBeenCalledWith({
        what: 'AUDIT_EVENT',
        who: 'user1',
        subjectId: 'subject123',
        subjectType: 'exampleType',
        correlationId: 'request123',
        details: { extraDetails: 'example' },
      })
    })
  })

  describe('logPageView', () => {
    it('sends page view event audit message using audit client', async () => {
      await auditService.logPageView(Page.EXAMPLE_PAGE, {
        who: 'user1',
        subjectId: 'subject123',
        subjectType: 'exampleType',
        correlationId: 'request123',
        details: { extraDetails: 'example' },
      })

      expect(hmppsAuditClient.sendMessage).toHaveBeenCalledWith({
        what: 'PAGE_VIEW_EXAMPLE_PAGE',
        who: 'user1',
        subjectId: 'subject123',
        subjectType: 'exampleType',
        correlationId: 'request123',
        details: { extraDetails: 'example' },
      })
    })
  })
})
