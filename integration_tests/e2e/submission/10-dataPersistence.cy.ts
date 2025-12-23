import AssistancePage from '../../pages/submission/assistancePage'
import MentalHealthPage from '../../pages/submission/mentalHealthPage'
import PersonalDetailsPage from '../../pages/submission/personalDetailsPage'
import SubmissionPage from '../../pages/submission/submissionPage'
import { createTestFixtures, setupCommonStubs, completeVerification, Checkin, Offender } from './_support'

describe('Form Data Persistence', () => {
  let testOffender: Offender
  let testCheckin: Checkin

  beforeEach(() => {
    const fixtures = createTestFixtures()
    testOffender = fixtures.testOffender
    testCheckin = fixtures.testCheckin
    setupCommonStubs(testCheckin)
  })

  describe('Data should persist when navigating back', () => {
    beforeEach(() => {
      completeVerification(testCheckin, testOffender)
    })

    it('should retain mental health selection when navigating back from assistance page', () => {
      const mentalHealthPage = SubmissionPage.verifyOnPage(MentalHealthPage)
      mentalHealthPage.strugglingRadio().click()
      mentalHealthPage.continueButton().click()

      cy.go('back')

      mentalHealthPage.strugglingRadio().should('be.checked')
    })

    it('should retain assistance selections when navigating back from callback page', () => {
      const mentalHealthPage = SubmissionPage.verifyOnPage(MentalHealthPage)
      mentalHealthPage.okRadio().click()
      mentalHealthPage.continueButton().click()

      const assistancePage = SubmissionPage.verifyOnPage(AssistancePage)
      assistancePage.selectMoney()
      assistancePage.enterMoneyReason('Test reason for money help')
      assistancePage.selectHousing()
      assistancePage.enterHousingReason('Test reason for housing help')
      assistancePage.continueButton().click()

      cy.go('back')

      cy.get('input[name="assistance"][value="MONEY"]').should('be.checked')
      cy.get('input[name="assistance"][value="HOUSING"]').should('be.checked')
      cy.get('#moneySupport').should('have.value', 'Test reason for money help')
      cy.get('#housingSupport').should('have.value', 'Test reason for housing help')
    })
  })

  describe('Data should persist after validation errors', () => {
    beforeEach(() => {
      cy.visit(`/${testCheckin.uuid}/verify`)
    })

    it('should retain entered values after validation error on verify page', () => {
      const personalDetailsPage = SubmissionPage.verifyOnPage(PersonalDetailsPage)

      personalDetailsPage.firstNameField().type('TestFirstName')
      personalDetailsPage.continueButton().click()

      personalDetailsPage.firstNameField().should('have.value', 'TestFirstName')
    })
  })
})
