import { createTestFixtures, setupCommonStubs, completeVerification, Checkin, Offender } from './_support'

describe('Session Management', () => {
  let testOffender: Offender
  let testCheckin: Checkin

  beforeEach(() => {
    const fixtures = createTestFixtures()
    testOffender = fixtures.testOffender
    testCheckin = fixtures.testCheckin
    setupCommonStubs(testCheckin)
  })

  describe('GET /:submissionId/timeout - Session timeout page', () => {
    it('should display the timeout page when accessing protected route without session', () => {
      // Try to access a protected route without completing verification
      cy.visit(`/${testCheckin.uuid}/questions/mental-health`)
      // Should render timeout page content (middleware renders in-place, doesn't redirect)
      cy.contains('Your check in has been reset').should('be.visible')
      cy.contains('a.govuk-button', 'Restart check in').should('be.visible')
    })
  })

  describe('GET /:submissionId/keepalive - Keep-alive endpoint', () => {
    it('should return success for keepalive request', () => {
      completeVerification(testCheckin, testOffender)
      cy.request(`/${testCheckin.uuid}/keepalive`).then(response => {
        expect(response.status).to.eq(200)
      })
    })
  })
})
