import PersonalDetailsPage from '../../pages/submission/personalDetailsPage'
import SubmissionPage from '../../pages/submission/submissionPage'
import { createTestFixtures, setupCommonStubs, Checkin, Offender } from './_support'

describe('Identity Verification', () => {
  let testOffender: Offender
  let testCheckin: Checkin

  beforeEach(() => {
    const fixtures = createTestFixtures()
    testOffender = fixtures.testOffender
    testCheckin = fixtures.testCheckin
    setupCommonStubs(testCheckin)
  })

  describe('GET /:submissionId/verify - Identity verification form', () => {
    it('should display the verify page with personal details form', () => {
      cy.visit(`/${testCheckin.uuid}/verify`)
      SubmissionPage.verifyOnPage(PersonalDetailsPage)
      cy.contains('h1', 'Personal details').should('be.visible')
    })

    it('should display all required form fields', () => {
      cy.visit(`/${testCheckin.uuid}/verify`)
      const personalDetailsPage = SubmissionPage.verifyOnPage(PersonalDetailsPage)
      personalDetailsPage.firstNameField().should('be.visible')
      personalDetailsPage.lastNameField().should('be.visible')
      personalDetailsPage.dayField().should('be.visible')
      personalDetailsPage.monthField().should('be.visible')
      personalDetailsPage.yearField().should('be.visible')
      personalDetailsPage.continueButton().should('be.visible')
    })
  })

  describe('POST /:submissionId/verify - Verify identity submission', () => {
    it('should redirect to mental health question after successful verification', () => {
      cy.visit(`/${testCheckin.uuid}/verify`)
      const personalDetailsPage = SubmissionPage.verifyOnPage(PersonalDetailsPage)
      const dob = new Date(testOffender.dateOfBirth)
      personalDetailsPage.completeForm({
        firstName: testOffender.firstName,
        lastName: testOffender.lastName,
        day: dob.getDate().toString(),
        month: (dob.getMonth() + 1).toString(),
        year: dob.getFullYear().toString(),
      })
      personalDetailsPage.continueButton().click()
      cy.url().should('include', '/questions/mental-health')
    })
  })
})
