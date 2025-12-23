import SubmissionPage from '../../pages/submission/submissionPage'
import VideoInformPage from '../../pages/submission/video/informPage'
import VideoRecordPage from '../../pages/submission/video/recordPage'
import VideoViewPage from '../../pages/submission/video/viewPage'
import {
  createTestFixtures,
  setupCommonStubs,
  completeVerification,
  completeQuestions,
  Checkin,
  Offender,
} from './_support'

describe('Video Flow', () => {
  let testOffender: Offender
  let testCheckin: Checkin

  beforeEach(() => {
    const fixtures = createTestFixtures()
    testOffender = fixtures.testOffender
    testCheckin = fixtures.testCheckin
    setupCommonStubs(testCheckin)
    completeVerification(testCheckin, testOffender)
    completeQuestions()
  })

  describe('GET /:submissionId/video/inform - Video recording instructions', () => {
    it('should display the video inform page', () => {
      SubmissionPage.verifyOnPage(VideoInformPage)
      cy.contains('h1', 'Confirm your identity').should('be.visible')
    })

    it('should have a continue button', () => {
      const informPage = SubmissionPage.verifyOnPage(VideoInformPage)
      informPage.continueButton().should('be.visible')
    })
  })

  describe('GET /:submissionId/video/record - Video recording page', () => {
    beforeEach(() => {
      const informPage = SubmissionPage.verifyOnPage(VideoInformPage)
      informPage.continueButton().click()
    })

    it('should display the video record page', () => {
      SubmissionPage.verifyOnPage(VideoRecordPage)
      cy.contains('h1', 'Record your video').should('be.visible')
    })

    it('should display video element and recording button', () => {
      const recordPage = SubmissionPage.verifyOnPage(VideoRecordPage)
      recordPage.videoElement().should('exist')
      recordPage.startRecordingButton().should('exist')
    })
  })

  describe('GET /:submissionId/video/view - Video review page', () => {
    it('should display the video view page', () => {
      cy.visit(`/${testCheckin.uuid}/video/view`)
      SubmissionPage.verifyOnPage(VideoViewPage)
    })

    it('should have submit anyway button for no match scenario', () => {
      cy.visit(`/${testCheckin.uuid}/video/view`)
      const videoViewPage = SubmissionPage.verifyOnPage(VideoViewPage)
      videoViewPage.submitAnywayButton().should('exist')
    })

    it('should redirect to check answers when submit anyway is clicked', () => {
      cy.visit(`/${testCheckin.uuid}/video/view`)
      const videoViewPage = SubmissionPage.verifyOnPage(VideoViewPage)
      videoViewPage.submitAnywayButton().click()
      cy.url().should('include', '/check-your-answers')
    })
  })
})
