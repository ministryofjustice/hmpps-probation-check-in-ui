import CheckAnswersPage from '../../pages/submission/checkAnswersPage'
import MentalHealthPage from '../../pages/submission/mentalHealthPage'
import SubmissionPage from '../../pages/submission/submissionPage'
import VideoViewPage from '../../pages/submission/video/viewPage'
import {
  createTestFixtures,
  setupCommonStubs,
  completeVerification,
  completeQuestions,
  Checkin,
  Offender,
} from './_support'

describe('Check Answers and Submit', () => {
  let testOffender: Offender
  let testCheckin: Checkin

  beforeEach(() => {
    const fixtures = createTestFixtures()
    testOffender = fixtures.testOffender
    testCheckin = fixtures.testCheckin
    setupCommonStubs(testCheckin)
    completeVerification(testCheckin, testOffender)
    completeQuestions()
    // Skip video recording for these tests
    cy.visit(`/${testCheckin.uuid}/video/view`)
    const videoViewPage = SubmissionPage.verifyOnPage(VideoViewPage)
    videoViewPage.submitAnywayButton().click()
  })

  describe('GET /:submissionId/check-your-answers - Summary and confirmation', () => {
    it('should display the check answers page', () => {
      SubmissionPage.verifyOnPage(CheckAnswersPage)
      cy.contains('h1', 'Check your answers before you complete your check in').should('be.visible')
    })

    it('should display summary of all answers', () => {
      const checkAnswersPage = SubmissionPage.verifyOnPage(CheckAnswersPage)
      checkAnswersPage.verifySummaryValue('How are you feeling?', 'OK')
    })

    it('should have change links for each answer', () => {
      cy.get('.govuk-summary-list__actions').should('have.length.at.least', 1)
      cy.get('.govuk-summary-list__actions a').contains('Change').should('exist')
    })

    it('should have confirm checkbox and complete button', () => {
      const checkAnswersPage = SubmissionPage.verifyOnPage(CheckAnswersPage)
      checkAnswersPage.confirmCheckbox().should('exist')
      checkAnswersPage.completeCheckinButton().should('exist')
    })
  })

  describe('Change links - Edit flow with checkAnswers=true', () => {
    it('should navigate to mental health question via change link', () => {
      const checkAnswersPage = SubmissionPage.verifyOnPage(CheckAnswersPage)
      checkAnswersPage.clickChangeLink('How are you feeling?')
      cy.url().should('include', '/questions/mental-health')
      cy.url().should('include', 'checkAnswers=true')
    })

    it('should return to check answers after editing mental health', () => {
      const checkAnswersPage = SubmissionPage.verifyOnPage(CheckAnswersPage)
      checkAnswersPage.clickChangeLink('How are you feeling?')

      const mentalHealthPage = SubmissionPage.verifyOnPage(MentalHealthPage)
      mentalHealthPage.wellRadio().click()
      mentalHealthPage.continueButton().click()

      cy.url().should('include', '/check-your-answers')
      SubmissionPage.verifyOnPage(CheckAnswersPage)
    })
  })

  describe('POST /:submissionId/check-your-answers - Final submission', () => {
    it('should redirect to confirmation page after successful submission', () => {
      const checkAnswersPage = SubmissionPage.verifyOnPage(CheckAnswersPage)
      checkAnswersPage.confirmCheckbox().check()
      checkAnswersPage.completeCheckinButton().click()
      cy.url().should('include', '/confirmation')
    })
  })
})
