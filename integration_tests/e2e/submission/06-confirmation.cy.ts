import CheckAnswersPage from '../../pages/submission/checkAnswersPage'
import ConfirmationPage from '../../pages/submission/confirmationPage'
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

describe('Confirmation Page', () => {
  let testOffender: Offender
  let testCheckin: Checkin

  beforeEach(() => {
    const fixtures = createTestFixtures()
    testOffender = fixtures.testOffender
    testCheckin = fixtures.testCheckin
    setupCommonStubs(testCheckin)
    completeVerification(testCheckin, testOffender)
    completeQuestions()
    cy.visit(`/${testCheckin.uuid}/video/view`)
    const videoViewPage = SubmissionPage.verifyOnPage(VideoViewPage)
    videoViewPage.submitAnywayButton().click()

    const checkAnswersPage = SubmissionPage.verifyOnPage(CheckAnswersPage)
    checkAnswersPage.confirmCheckbox().check()
    checkAnswersPage.completeCheckinButton().click()
  })

  describe('GET /:submissionId/confirmation - Final confirmation page', () => {
    it('should display the confirmation page', () => {
      SubmissionPage.verifyOnPage(ConfirmationPage)
      cy.contains('h1', 'Check in completed').should('be.visible')
    })

    it('should display the confirmation panel', () => {
      const confirmationPage = SubmissionPage.verifyOnPage(ConfirmationPage)
      confirmationPage.panel().should('exist')
      confirmationPage.panelTitle().should('contain.text', 'Check in completed')
    })
  })
})
