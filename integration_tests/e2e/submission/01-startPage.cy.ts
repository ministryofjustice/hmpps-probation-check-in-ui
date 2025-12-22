import CheckinIndexPage from '../../pages/submission/checkinIndexPage'
import SubmissionPage from '../../pages/submission/submissionPage'
import { createTestFixtures, setupCommonStubs, Checkin } from './_support'

describe('Start Page', () => {
  let testCheckin: Checkin

  beforeEach(() => {
    const fixtures = createTestFixtures()
    testCheckin = fixtures.testCheckin
    setupCommonStubs(testCheckin)
  })

  describe('GET /:submissionId/ - Start page', () => {
    it('should display the start page with correct heading', () => {
      cy.visit(`/${testCheckin.uuid}`)
      SubmissionPage.verifyOnPage(CheckinIndexPage)
      cy.contains('h1', 'Check in with your probation officer').should('be.visible')
    })

    it('should display the start button', () => {
      cy.visit(`/${testCheckin.uuid}`)
      const indexPage = SubmissionPage.verifyOnPage(CheckinIndexPage)
      indexPage.startButton().should('be.visible').and('contain.text', 'Start now')
    })
  })

  describe('POST /:submissionId/start - Start button handler', () => {
    it('should redirect to verify page when start button is clicked', () => {
      cy.visit(`/${testCheckin.uuid}`)
      const indexPage = SubmissionPage.verifyOnPage(CheckinIndexPage)
      indexPage.startButton().click()
      cy.url().should('include', '/verify')
    })
  })
})
