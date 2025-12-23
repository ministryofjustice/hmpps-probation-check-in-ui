import AssistancePage from '../../pages/submission/assistancePage'
import CallbackPage from '../../pages/submission/callbackPage'
import CheckAnswersPage from '../../pages/submission/checkAnswersPage'
import CheckinIndexPage from '../../pages/submission/checkinIndexPage'
import ConfirmationPage from '../../pages/submission/confirmationPage'
import MentalHealthPage from '../../pages/submission/mentalHealthPage'
import PersonalDetailsPage from '../../pages/submission/personalDetailsPage'
import SubmissionPage from '../../pages/submission/submissionPage'
import VideoInformPage from '../../pages/submission/video/informPage'
import VideoRecordPage from '../../pages/submission/video/recordPage'
import VideoViewPage from '../../pages/submission/video/viewPage'
import { createTestFixtures, setupCommonStubs, Checkin, Offender } from './_support'

describe('Complete Journey - Happy Path', () => {
  let testOffender: Offender
  let testCheckin: Checkin

  beforeEach(() => {
    const fixtures = createTestFixtures()
    testOffender = fixtures.testOffender
    testCheckin = fixtures.testCheckin
    setupCommonStubs(testCheckin)
  })

  it('should complete the entire check-in journey from start to confirmation', () => {
    // 1. Start page
    cy.visit(`/${testCheckin.uuid}`)
    const indexPage = SubmissionPage.verifyOnPage(CheckinIndexPage)
    cy.contains('h1', 'Check in with your probation officer').should('be.visible')
    indexPage.startButton().click()

    // 2. Verify identity
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

    // 3. Mental health question
    const mentalHealthPage = SubmissionPage.verifyOnPage(MentalHealthPage)
    mentalHealthPage.okRadio().click()
    mentalHealthPage.continueButton().click()

    // 4. Assistance question
    const assistancePage = SubmissionPage.verifyOnPage(AssistancePage)
    assistancePage.selectMoney()
    assistancePage.enterMoneyReason('Need help with budgeting')
    assistancePage.continueButton().click()

    // 5. Callback question
    const callbackPage = SubmissionPage.verifyOnPage(CallbackPage)
    callbackPage.selectYesAndProvideDetails('Would like to discuss my progress')
    callbackPage.continueButton().click()

    // 6. Video inform
    const informPage = SubmissionPage.verifyOnPage(VideoInformPage)
    informPage.continueButton().click()

    // 7. Video record (skip actual recording)
    SubmissionPage.verifyOnPage(VideoRecordPage)
    cy.visit(`/${testCheckin.uuid}/video/view`)

    // 8. Video view
    const videoViewPage = SubmissionPage.verifyOnPage(VideoViewPage)
    videoViewPage.submitAnywayButton().click()

    // 9. Check answers
    const checkAnswersPage = SubmissionPage.verifyOnPage(CheckAnswersPage)
    checkAnswersPage.verifySummaryValue('How are you feeling?', 'OK')
    checkAnswersPage.verifySummaryValue('Tell us why you need help with money', 'Need help with budgeting')
    checkAnswersPage.verifySummaryValue(
      'Is there anything else you need to speak with your probation officer about?',
      'Yes',
    )
    checkAnswersPage.verifySummaryValue('Tell us what you need to talk about', 'Would like to discuss my progress')
    checkAnswersPage.confirmCheckbox().check()
    checkAnswersPage.completeCheckinButton().click()

    // 10. Confirmation
    SubmissionPage.verifyOnPage(ConfirmationPage)
    cy.contains('h1', 'Check in completed').should('be.visible')
  })
})
