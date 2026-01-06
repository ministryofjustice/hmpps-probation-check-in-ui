import { createTestFixtures, setupCommonStubs, createMockCheckin, CheckinStatus, Checkin, Offender } from './_support'

describe('Error States', () => {
  let testOffender: Offender
  let testCheckin: Checkin

  beforeEach(() => {
    const fixtures = createTestFixtures()
    testOffender = fixtures.testOffender
    testCheckin = fixtures.testCheckin
    setupCommonStubs(testCheckin)
  })

  describe('Not Found - Invalid submission ID', () => {
    it('should display not found page for invalid UUID', () => {
      cy.visit('/invalid-uuid-12345', { failOnStatusCode: false })
      cy.contains('not found', { matchCase: false }).should('be.visible')
    })
  })

  describe('Expired Check-in', () => {
    it('should display expired page for expired check-in', () => {
      const expiredCheckin = createMockCheckin(testOffender, {
        status: CheckinStatus.Expired,
      })
      cy.task('stubGetCheckin', expiredCheckin)
      cy.visit(`/${expiredCheckin.uuid}`)
      cy.contains('expired', { matchCase: false }).should('be.visible')
    })
  })
})
