import Checkin from '../../../server/data/models/checkin'
import CheckinStatus from '../../../server/data/models/checkinStatus'
import Offender from '../../../server/data/models/offender'
import OffenderStatus from '../../../server/data/models/offenderStatus'
import { createMockCheckin, createMockOffender } from '../../mockApis/esupervisionApi'
import AdditionalQuestionPage from '../../pages/submission/additionalQuestionPage'
import AssistancePage from '../../pages/submission/assistancePage'
import CheckinIndexPage from '../../pages/submission/checkinIndexPage'
import MentalHealthPage from '../../pages/submission/mentalHealthPage'
import PersonalDetailsPage from '../../pages/submission/personalDetailsPage'
import SubmissionPage from '../../pages/submission/submissionPage'
import VideoInformPage from '../../pages/submission/video/informPage'
import OutcomePage from '../../pages/submission/video/outcomePage'
import VideoRecordPage from '../../pages/submission/video/recordPage'
import VideoViewPage from '../../pages/submission/video/viewPage'

describe('Start Check-in Journey', () => {
  let testOffender: Offender
  let testCheckin: Checkin
  beforeEach(() => {
    testOffender = createMockOffender({ status: OffenderStatus.Verified })
    testCheckin = createMockCheckin(testOffender, {
      status: CheckinStatus.Created,
    })

    cy.task('reset').then(() => {
      cy.task('stubAuthToken')
      cy.task('stubGetCheckin', testCheckin)
      cy.task('stubAdditionalQuestions', testCheckin)
      cy.task('stubGetCheckinUploadLocation', testCheckin)
      cy.task('stubFakeS3Upload')
      cy.task('stubCreateLivenessSession', testCheckin)
      cy.task('stubGetLivenessCredentials', testCheckin)
      cy.task('stubVerifyIdentity', testCheckin)
      cy.task('stubSubmitCheckin', testCheckin)
    })
  })
  it('should simulate aws rekognition checks (photo match and liveness pass)', () => {
    cy.task('stubLivenessSuccessRightPerson', testCheckin)
    cy.visit(`/${testCheckin.uuid}`)
    const submissionIndexPage = SubmissionPage.verifyOnPage(CheckinIndexPage)
    cy.contains('h1', 'Check in with your probation officer').should('be.visible')
    submissionIndexPage.startButton().should('contain.text', 'Start now')
    submissionIndexPage.startButton().click()
    const personalDetailsPage = SubmissionPage.verifyOnPage(PersonalDetailsPage)
    const { firstName } = testOffender
    const { lastName } = testOffender
    const dob = new Date(testOffender.dateOfBirth)
    const day = dob.getDate().toString()
    const month = (dob.getMonth() + 1).toString()
    const year = dob.getFullYear().toString()
    personalDetailsPage.completeForm({
      firstName,
      lastName,
      day,
      month,
      year,
    })
    personalDetailsPage.continueButton().click()
    const mentalHealthPage = SubmissionPage.verifyOnPage(MentalHealthPage)
    mentalHealthPage.veryWellRadio().should('exist')
    mentalHealthPage.wellRadio().should('exist')
    mentalHealthPage.okRadio().should('exist')
    mentalHealthPage.notGreatRadio().should('exist')
    mentalHealthPage.strugglingRadio().should('exist')
    mentalHealthPage.okRadio().click()
    mentalHealthPage.continueButton().click()
    const assistancePage = SubmissionPage.verifyOnPage(AssistancePage)
    assistancePage.selectMoney()
    assistancePage.enterMoneyReason('I am having trouble with my budgeting.')
    assistancePage.selectHousing()
    assistancePage.enterHousingReason('I need to find a new place to live.')
    assistancePage.selectEmploymentEduSupport()
    assistancePage.enterEmploymentEduReason('I need to get a job.')
    assistancePage.continueButton().click()
    const additionalQuestionPage = new AdditionalQuestionPage('How was the pottery class?')
    additionalQuestionPage.answerTextarea().type('It was great!')
    additionalQuestionPage.continueButton().click()

    const informPage = SubmissionPage.verifyOnPage(VideoInformPage)
    informPage.continueButton().should('exist')
    // we are using a mock component instead of rendering the actual aws rekog screen
    cy.visit(`/${testCheckin.uuid}/liveness/record?mock=true`)
    const recordPage = SubmissionPage.verifyOnPage(VideoRecordPage)
    recordPage.simulateCompleteButton().click()
    cy.url().should('include', '/outcome/match')
    cy.visit(`/${testCheckin.uuid}/liveness/view`)
    const videoViewPage = SubmissionPage.verifyOnPage(VideoViewPage)
    videoViewPage.verifyHeadingText('We have confirmed this is you')
  })

  it('should simulate aws rekognition checks (photo match and liveness fail)', () => {
    cy.task('stubLivenessFailRightPerson', testCheckin)
    cy.visit(`/${testCheckin.uuid}`)
    const submissionIndexPage = SubmissionPage.verifyOnPage(CheckinIndexPage)
    cy.contains('h1', 'Check in with your probation officer').should('be.visible')
    submissionIndexPage.startButton().should('contain.text', 'Start now')
    submissionIndexPage.startButton().click()
    const personalDetailsPage = SubmissionPage.verifyOnPage(PersonalDetailsPage)
    const { firstName } = testOffender
    const { lastName } = testOffender
    const dob = new Date(testOffender.dateOfBirth)
    const day = dob.getDate().toString()
    const month = (dob.getMonth() + 1).toString()
    const year = dob.getFullYear().toString()
    personalDetailsPage.completeForm({
      firstName,
      lastName,
      day,
      month,
      year,
    })
    personalDetailsPage.continueButton().click()
    const mentalHealthPage = SubmissionPage.verifyOnPage(MentalHealthPage)
    mentalHealthPage.veryWellRadio().should('exist')
    mentalHealthPage.wellRadio().should('exist')
    mentalHealthPage.okRadio().should('exist')
    mentalHealthPage.notGreatRadio().should('exist')
    mentalHealthPage.strugglingRadio().should('exist')
    mentalHealthPage.okRadio().click()
    mentalHealthPage.continueButton().click()
    const assistancePage = SubmissionPage.verifyOnPage(AssistancePage)
    assistancePage.selectMoney()
    assistancePage.enterMoneyReason('I am having trouble with my budgeting.')
    assistancePage.selectHousing()
    assistancePage.enterHousingReason('I need to find a new place to live.')
    assistancePage.selectEmploymentEduSupport()
    assistancePage.enterEmploymentEduReason('I need to get a job.')
    assistancePage.continueButton().click()
    const additionalQuestionPage = new AdditionalQuestionPage('How was the pottery class?')
    additionalQuestionPage.answerTextarea().type('It was great!')
    additionalQuestionPage.continueButton().click()

    const informPage = SubmissionPage.verifyOnPage(VideoInformPage)
    informPage.continueButton().should('exist')
    // we are using a mock component instead of rendering the actual aws rekog screen
    cy.visit(`/${testCheckin.uuid}/liveness/record?mock=true`)
    const recordPage = SubmissionPage.verifyOnPage(VideoRecordPage)
    recordPage.simulateCompleteButton().click()
    cy.visit(`/${testCheckin.uuid}/liveness/view`)
    const videoViewPage = SubmissionPage.verifyOnPage(VideoViewPage)
    videoViewPage.verifyHeadingText('We cannot confirm your identity')
  })
  it('should simulate aws rekognition checks (photo mis-match and liveness success)', () => {
    cy.task('stubLivenessSuccessWrongPerson', testCheckin)
    cy.visit(`/${testCheckin.uuid}`)
    const submissionIndexPage = SubmissionPage.verifyOnPage(CheckinIndexPage)
    cy.contains('h1', 'Check in with your probation officer').should('be.visible')
    submissionIndexPage.startButton().should('contain.text', 'Start now')
    submissionIndexPage.startButton().click()
    const personalDetailsPage = SubmissionPage.verifyOnPage(PersonalDetailsPage)
    const { firstName } = testOffender
    const { lastName } = testOffender
    const dob = new Date(testOffender.dateOfBirth)
    const day = dob.getDate().toString()
    const month = (dob.getMonth() + 1).toString()
    const year = dob.getFullYear().toString()
    personalDetailsPage.completeForm({
      firstName,
      lastName,
      day,
      month,
      year,
    })
    personalDetailsPage.continueButton().click()
    const mentalHealthPage = SubmissionPage.verifyOnPage(MentalHealthPage)
    mentalHealthPage.veryWellRadio().should('exist')
    mentalHealthPage.wellRadio().should('exist')
    mentalHealthPage.okRadio().should('exist')
    mentalHealthPage.notGreatRadio().should('exist')
    mentalHealthPage.strugglingRadio().should('exist')
    mentalHealthPage.okRadio().click()
    mentalHealthPage.continueButton().click()
    const assistancePage = SubmissionPage.verifyOnPage(AssistancePage)
    assistancePage.selectMoney()
    assistancePage.enterMoneyReason('I am having trouble with my budgeting.')
    assistancePage.selectHousing()
    assistancePage.enterHousingReason('I need to find a new place to live.')
    assistancePage.selectEmploymentEduSupport()
    assistancePage.enterEmploymentEduReason('I need to get a job.')
    assistancePage.continueButton().click()
    const additionalQuestionPage = new AdditionalQuestionPage('How was the pottery class?')
    additionalQuestionPage.answerTextarea().type('It was great!')
    additionalQuestionPage.continueButton().click()

    const informPage = SubmissionPage.verifyOnPage(VideoInformPage)
    informPage.continueButton().should('exist')
    // we are using a mock component instead of rendering the actual aws rekog screen
    cy.visit(`/${testCheckin.uuid}/liveness/record?mock=true`)
    const recordPage = SubmissionPage.verifyOnPage(VideoRecordPage)
    recordPage.simulateCompleteButton().click()
    cy.visit(`/${testCheckin.uuid}/liveness/view`)
    const videoViewPage = SubmissionPage.verifyOnPage(VideoViewPage)
    videoViewPage.verifyHeadingText('We cannot confirm this is you')
  })
  it('should simulate aws rekognition checks (photo mis-match and liveness fail)', () => {
    cy.task('stubLivenessFailWrongPerson', testCheckin)
    cy.visit(`/${testCheckin.uuid}`)
    const submissionIndexPage = SubmissionPage.verifyOnPage(CheckinIndexPage)
    cy.contains('h1', 'Check in with your probation officer').should('be.visible')
    submissionIndexPage.startButton().should('contain.text', 'Start now')
    submissionIndexPage.startButton().click()
    const personalDetailsPage = SubmissionPage.verifyOnPage(PersonalDetailsPage)
    const { firstName } = testOffender
    const { lastName } = testOffender
    const dob = new Date(testOffender.dateOfBirth)
    const day = dob.getDate().toString()
    const month = (dob.getMonth() + 1).toString()
    const year = dob.getFullYear().toString()
    personalDetailsPage.completeForm({
      firstName,
      lastName,
      day,
      month,
      year,
    })
    personalDetailsPage.continueButton().click()
    const mentalHealthPage = SubmissionPage.verifyOnPage(MentalHealthPage)
    mentalHealthPage.veryWellRadio().should('exist')
    mentalHealthPage.wellRadio().should('exist')
    mentalHealthPage.okRadio().should('exist')
    mentalHealthPage.notGreatRadio().should('exist')
    mentalHealthPage.strugglingRadio().should('exist')
    mentalHealthPage.okRadio().click()
    mentalHealthPage.continueButton().click()
    const assistancePage = SubmissionPage.verifyOnPage(AssistancePage)
    assistancePage.selectMoney()
    assistancePage.enterMoneyReason('I am having trouble with my budgeting.')
    assistancePage.selectHousing()
    assistancePage.enterHousingReason('I need to find a new place to live.')
    assistancePage.selectEmploymentEduSupport()
    assistancePage.enterEmploymentEduReason('I need to get a job.')
    assistancePage.continueButton().click()
    const additionalQuestionPage = new AdditionalQuestionPage('How was the pottery class?')
    additionalQuestionPage.answerTextarea().type('It was great!')
    additionalQuestionPage.continueButton().click()

    const informPage = SubmissionPage.verifyOnPage(VideoInformPage)
    informPage.continueButton().should('exist')
    // we are using a mock component instead of rendering the actual aws rekog screen
    cy.visit(`/${testCheckin.uuid}/liveness/record?mock=true`)
    const recordPage = SubmissionPage.verifyOnPage(VideoRecordPage)
    recordPage.simulateCompleteButton().click()
    cy.visit(`/${testCheckin.uuid}/liveness/view`)
    const videoViewPage = SubmissionPage.verifyOnPage(VideoViewPage)
    videoViewPage.verifyHeadingText("There's been a problem with your identity check")
  })

  // cancelled error
  it('should simulate aws rekognition checks and show appropriate cancelled error page', () => {
    cy.task('stubLivenessSuccessRightPerson', testCheckin)
    cy.visit(`/${testCheckin.uuid}`)
    const submissionIndexPage = SubmissionPage.verifyOnPage(CheckinIndexPage)
    cy.contains('h1', 'Check in with your probation officer').should('be.visible')
    submissionIndexPage.startButton().should('contain.text', 'Start now')
    submissionIndexPage.startButton().click()
    const personalDetailsPage = SubmissionPage.verifyOnPage(PersonalDetailsPage)
    const { firstName } = testOffender
    const { lastName } = testOffender
    const dob = new Date(testOffender.dateOfBirth)
    const day = dob.getDate().toString()
    const month = (dob.getMonth() + 1).toString()
    const year = dob.getFullYear().toString()
    personalDetailsPage.completeForm({
      firstName,
      lastName,
      day,
      month,
      year,
    })
    personalDetailsPage.continueButton().click()
    const mentalHealthPage = SubmissionPage.verifyOnPage(MentalHealthPage)
    mentalHealthPage.veryWellRadio().should('exist')
    mentalHealthPage.wellRadio().should('exist')
    mentalHealthPage.okRadio().should('exist')
    mentalHealthPage.notGreatRadio().should('exist')
    mentalHealthPage.strugglingRadio().should('exist')
    mentalHealthPage.okRadio().click()
    mentalHealthPage.continueButton().click()
    const assistancePage = SubmissionPage.verifyOnPage(AssistancePage)
    assistancePage.selectMoney()
    assistancePage.enterMoneyReason('I am having trouble with my budgeting.')
    assistancePage.selectHousing()
    assistancePage.enterHousingReason('I need to find a new place to live.')
    assistancePage.selectEmploymentEduSupport()
    assistancePage.enterEmploymentEduReason('I need to get a job.')
    assistancePage.continueButton().click()
    const additionalQuestionPage = new AdditionalQuestionPage('How was the pottery class?')
    additionalQuestionPage.answerTextarea().type('It was great!')
    additionalQuestionPage.continueButton().click()

    const informPage = SubmissionPage.verifyOnPage(VideoInformPage)
    informPage.continueButton().should('exist')
    // we are using a mock component instead of rendering the actual aws rekog screen
    cy.visit(`/${testCheckin.uuid}/liveness/record?mock=true`)
    const recordPage = SubmissionPage.verifyOnPage(VideoRecordPage)
    recordPage.simulateCancelButton().click()
    cy.url().should('include', '/outcome/cancelled')
    const outcomePage = SubmissionPage.verifyOnPage(OutcomePage)
    outcomePage.verifyHeadingText('We could not complete your identity check')
  })

  // timeout error
  it('should simulate aws rekognition checks and show appropriate timeout error page', () => {
    cy.task('stubLivenessSuccessRightPerson', testCheckin)
    cy.visit(`/${testCheckin.uuid}`)
    const submissionIndexPage = SubmissionPage.verifyOnPage(CheckinIndexPage)
    cy.contains('h1', 'Check in with your probation officer').should('be.visible')
    submissionIndexPage.startButton().should('contain.text', 'Start now')
    submissionIndexPage.startButton().click()
    const personalDetailsPage = SubmissionPage.verifyOnPage(PersonalDetailsPage)
    const { firstName } = testOffender
    const { lastName } = testOffender
    const dob = new Date(testOffender.dateOfBirth)
    const day = dob.getDate().toString()
    const month = (dob.getMonth() + 1).toString()
    const year = dob.getFullYear().toString()
    personalDetailsPage.completeForm({
      firstName,
      lastName,
      day,
      month,
      year,
    })
    personalDetailsPage.continueButton().click()
    const mentalHealthPage = SubmissionPage.verifyOnPage(MentalHealthPage)
    mentalHealthPage.veryWellRadio().should('exist')
    mentalHealthPage.wellRadio().should('exist')
    mentalHealthPage.okRadio().should('exist')
    mentalHealthPage.notGreatRadio().should('exist')
    mentalHealthPage.strugglingRadio().should('exist')
    mentalHealthPage.okRadio().click()
    mentalHealthPage.continueButton().click()
    const assistancePage = SubmissionPage.verifyOnPage(AssistancePage)
    assistancePage.selectMoney()
    assistancePage.enterMoneyReason('I am having trouble with my budgeting.')
    assistancePage.selectHousing()
    assistancePage.enterHousingReason('I need to find a new place to live.')
    assistancePage.selectEmploymentEduSupport()
    assistancePage.enterEmploymentEduReason('I need to get a job.')
    assistancePage.continueButton().click()
    const additionalQuestionPage = new AdditionalQuestionPage('How was the pottery class?')
    additionalQuestionPage.answerTextarea().type('It was great!')
    additionalQuestionPage.continueButton().click()

    const informPage = SubmissionPage.verifyOnPage(VideoInformPage)
    informPage.continueButton().should('exist')
    // we are using a mock component instead of rendering the actual aws rekog screen
    cy.visit(`/${testCheckin.uuid}/liveness/record?mock=true`)
    const recordPage = SubmissionPage.verifyOnPage(VideoRecordPage)
    recordPage.simulateTimeoutButton().click()
    cy.url().should('include', '/outcome/timeout')
    const outcomePage = SubmissionPage.verifyOnPage(OutcomePage)
    outcomePage.verifyHeadingText("There's been a problem with your identity check")
    outcomePage.verifyIntroText(
      'We cannot confirm this is you. This is because you ran out of time to move your face during your identity check.',
    )
  })

  // connection timeout error
  it('should simulate aws rekognition checks and show appropriate connection timeout error page', () => {
    cy.task('stubLivenessSuccessRightPerson', testCheckin)
    cy.visit(`/${testCheckin.uuid}`)
    const submissionIndexPage = SubmissionPage.verifyOnPage(CheckinIndexPage)
    cy.contains('h1', 'Check in with your probation officer').should('be.visible')
    submissionIndexPage.startButton().should('contain.text', 'Start now')
    submissionIndexPage.startButton().click()
    const personalDetailsPage = SubmissionPage.verifyOnPage(PersonalDetailsPage)
    const { firstName } = testOffender
    const { lastName } = testOffender
    const dob = new Date(testOffender.dateOfBirth)
    const day = dob.getDate().toString()
    const month = (dob.getMonth() + 1).toString()
    const year = dob.getFullYear().toString()
    personalDetailsPage.completeForm({
      firstName,
      lastName,
      day,
      month,
      year,
    })
    personalDetailsPage.continueButton().click()
    const mentalHealthPage = SubmissionPage.verifyOnPage(MentalHealthPage)
    mentalHealthPage.veryWellRadio().should('exist')
    mentalHealthPage.wellRadio().should('exist')
    mentalHealthPage.okRadio().should('exist')
    mentalHealthPage.notGreatRadio().should('exist')
    mentalHealthPage.strugglingRadio().should('exist')
    mentalHealthPage.okRadio().click()
    mentalHealthPage.continueButton().click()
    const assistancePage = SubmissionPage.verifyOnPage(AssistancePage)
    assistancePage.selectMoney()
    assistancePage.enterMoneyReason('I am having trouble with my budgeting.')
    assistancePage.selectHousing()
    assistancePage.enterHousingReason('I need to find a new place to live.')
    assistancePage.selectEmploymentEduSupport()
    assistancePage.enterEmploymentEduReason('I need to get a job.')
    assistancePage.continueButton().click()
    const additionalQuestionPage = new AdditionalQuestionPage('How was the pottery class?')
    additionalQuestionPage.answerTextarea().type('It was great!')
    additionalQuestionPage.continueButton().click()

    const informPage = SubmissionPage.verifyOnPage(VideoInformPage)
    informPage.continueButton().should('exist')
    // we are using a mock component instead of rendering the actual aws rekog screen
    cy.visit(`/${testCheckin.uuid}/liveness/record?mock=true`)
    const recordPage = SubmissionPage.verifyOnPage(VideoRecordPage)
    recordPage.simulateConnectionTimeoutButton().click()
    cy.url().should('include', '/outcome/connection-timeout')
    const outcomePage = SubmissionPage.verifyOnPage(OutcomePage)
    outcomePage.verifyHeadingText('Check your internet connection')
    outcomePage.verifyIntroText(
      'Your internet connection might not be working properly. You can try to verify your identity again.',
    )
  })

  // landscape error
  it('should simulate aws rekognition checks and show appropriate landscape error page', () => {
    cy.task('stubLivenessSuccessRightPerson', testCheckin)
    cy.visit(`/${testCheckin.uuid}`)
    const submissionIndexPage = SubmissionPage.verifyOnPage(CheckinIndexPage)
    cy.contains('h1', 'Check in with your probation officer').should('be.visible')
    submissionIndexPage.startButton().should('contain.text', 'Start now')
    submissionIndexPage.startButton().click()
    const personalDetailsPage = SubmissionPage.verifyOnPage(PersonalDetailsPage)
    const { firstName } = testOffender
    const { lastName } = testOffender
    const dob = new Date(testOffender.dateOfBirth)
    const day = dob.getDate().toString()
    const month = (dob.getMonth() + 1).toString()
    const year = dob.getFullYear().toString()
    personalDetailsPage.completeForm({
      firstName,
      lastName,
      day,
      month,
      year,
    })
    personalDetailsPage.continueButton().click()
    const mentalHealthPage = SubmissionPage.verifyOnPage(MentalHealthPage)
    mentalHealthPage.veryWellRadio().should('exist')
    mentalHealthPage.wellRadio().should('exist')
    mentalHealthPage.okRadio().should('exist')
    mentalHealthPage.notGreatRadio().should('exist')
    mentalHealthPage.strugglingRadio().should('exist')
    mentalHealthPage.okRadio().click()
    mentalHealthPage.continueButton().click()
    const assistancePage = SubmissionPage.verifyOnPage(AssistancePage)
    assistancePage.selectMoney()
    assistancePage.enterMoneyReason('I am having trouble with my budgeting.')
    assistancePage.selectHousing()
    assistancePage.enterHousingReason('I need to find a new place to live.')
    assistancePage.selectEmploymentEduSupport()
    assistancePage.enterEmploymentEduReason('I need to get a job.')
    assistancePage.continueButton().click()
    const additionalQuestionPage = new AdditionalQuestionPage('How was the pottery class?')
    additionalQuestionPage.answerTextarea().type('It was great!')
    additionalQuestionPage.continueButton().click()

    const informPage = SubmissionPage.verifyOnPage(VideoInformPage)
    informPage.continueButton().should('exist')
    // we are using a mock component instead of rendering the actual aws rekog screen
    cy.visit(`/${testCheckin.uuid}/liveness/record?mock=true`)
    const recordPage = SubmissionPage.verifyOnPage(VideoRecordPage)
    recordPage.simulateMobileLandscapeButton().click()
    cy.url().should('include', '/outcome/landscape')
    const outcomePage = SubmissionPage.verifyOnPage(OutcomePage)
    outcomePage.verifyHeadingText("There's been a problem with your identity check")
    outcomePage.verifyIntroText(
      'This is because your device is in landscape when we’re trying to verify your identity.',
    )
  })

  // camera framerate error
  it('should simulate aws rekognition checks and show appropriate camera framereate error page', () => {
    cy.task('stubLivenessSuccessRightPerson', testCheckin)
    cy.visit(`/${testCheckin.uuid}`)
    const submissionIndexPage = SubmissionPage.verifyOnPage(CheckinIndexPage)
    cy.contains('h1', 'Check in with your probation officer').should('be.visible')
    submissionIndexPage.startButton().should('contain.text', 'Start now')
    submissionIndexPage.startButton().click()
    const personalDetailsPage = SubmissionPage.verifyOnPage(PersonalDetailsPage)
    const { firstName } = testOffender
    const { lastName } = testOffender
    const dob = new Date(testOffender.dateOfBirth)
    const day = dob.getDate().toString()
    const month = (dob.getMonth() + 1).toString()
    const year = dob.getFullYear().toString()
    personalDetailsPage.completeForm({
      firstName,
      lastName,
      day,
      month,
      year,
    })
    personalDetailsPage.continueButton().click()
    const mentalHealthPage = SubmissionPage.verifyOnPage(MentalHealthPage)
    mentalHealthPage.veryWellRadio().should('exist')
    mentalHealthPage.wellRadio().should('exist')
    mentalHealthPage.okRadio().should('exist')
    mentalHealthPage.notGreatRadio().should('exist')
    mentalHealthPage.strugglingRadio().should('exist')
    mentalHealthPage.okRadio().click()
    mentalHealthPage.continueButton().click()
    const assistancePage = SubmissionPage.verifyOnPage(AssistancePage)
    assistancePage.selectMoney()
    assistancePage.enterMoneyReason('I am having trouble with my budgeting.')
    assistancePage.selectHousing()
    assistancePage.enterHousingReason('I need to find a new place to live.')
    assistancePage.selectEmploymentEduSupport()
    assistancePage.enterEmploymentEduReason('I need to get a job.')
    assistancePage.continueButton().click()
    const additionalQuestionPage = new AdditionalQuestionPage('How was the pottery class?')
    additionalQuestionPage.answerTextarea().type('It was great!')
    additionalQuestionPage.continueButton().click()

    const informPage = SubmissionPage.verifyOnPage(VideoInformPage)
    informPage.continueButton().should('exist')
    // we are using a mock component instead of rendering the actual aws rekog screen
    cy.visit(`/${testCheckin.uuid}/liveness/record?mock=true`)
    const recordPage = SubmissionPage.verifyOnPage(VideoRecordPage)
    recordPage.simulateCameraFramerateButton().click()
    cy.url().should('include', '/outcome/camera-framerate')
    const outcomePage = SubmissionPage.verifyOnPage(OutcomePage)
    outcomePage.verifyHeadingText("There's been a problem with your identity check")
    outcomePage.verifyIntroText(
      'This is because your camera is working slowly when we’re trying to verify your identity.',
    )
  })

  // multiple faces
  it('should simulate aws rekognition checks and show appropriate multiple faces error page', () => {
    cy.task('stubLivenessSuccessRightPerson', testCheckin)
    cy.visit(`/${testCheckin.uuid}`)
    const submissionIndexPage = SubmissionPage.verifyOnPage(CheckinIndexPage)
    cy.contains('h1', 'Check in with your probation officer').should('be.visible')
    submissionIndexPage.startButton().should('contain.text', 'Start now')
    submissionIndexPage.startButton().click()
    const personalDetailsPage = SubmissionPage.verifyOnPage(PersonalDetailsPage)
    const { firstName } = testOffender
    const { lastName } = testOffender
    const dob = new Date(testOffender.dateOfBirth)
    const day = dob.getDate().toString()
    const month = (dob.getMonth() + 1).toString()
    const year = dob.getFullYear().toString()
    personalDetailsPage.completeForm({
      firstName,
      lastName,
      day,
      month,
      year,
    })
    personalDetailsPage.continueButton().click()
    const mentalHealthPage = SubmissionPage.verifyOnPage(MentalHealthPage)
    mentalHealthPage.veryWellRadio().should('exist')
    mentalHealthPage.wellRadio().should('exist')
    mentalHealthPage.okRadio().should('exist')
    mentalHealthPage.notGreatRadio().should('exist')
    mentalHealthPage.strugglingRadio().should('exist')
    mentalHealthPage.okRadio().click()
    mentalHealthPage.continueButton().click()
    const assistancePage = SubmissionPage.verifyOnPage(AssistancePage)
    assistancePage.selectMoney()
    assistancePage.enterMoneyReason('I am having trouble with my budgeting.')
    assistancePage.selectHousing()
    assistancePage.enterHousingReason('I need to find a new place to live.')
    assistancePage.selectEmploymentEduSupport()
    assistancePage.enterEmploymentEduReason('I need to get a job.')
    assistancePage.continueButton().click()
    const additionalQuestionPage = new AdditionalQuestionPage('How was the pottery class?')
    additionalQuestionPage.answerTextarea().type('It was great!')
    additionalQuestionPage.continueButton().click()

    const informPage = SubmissionPage.verifyOnPage(VideoInformPage)
    informPage.continueButton().should('exist')
    // we are using a mock component instead of rendering the actual aws rekog screen
    cy.visit(`/${testCheckin.uuid}/liveness/record?mock=true`)
    const recordPage = SubmissionPage.verifyOnPage(VideoRecordPage)
    recordPage.simulateMultipleFacesButton().click()
    cy.url().should('include', '/outcome/multiple-faces')
    const outcomePage = SubmissionPage.verifyOnPage(OutcomePage)
    outcomePage.verifyHeadingText("There's been a problem with your identity check")
    outcomePage.verifyIntroText(
      'This is because there are other faces in the frame when we’re trying to verify your identity.',
    )
  })

  // camera access error
  it('should simulate aws rekognition checks and show appropriate error page', () => {
    cy.visit(`/${testCheckin.uuid}`)
    const submissionIndexPage = SubmissionPage.verifyOnPage(CheckinIndexPage)
    cy.contains('h1', 'Check in with your probation officer').should('be.visible')
    submissionIndexPage.startButton().should('contain.text', 'Start now')
    submissionIndexPage.startButton().click()
    const personalDetailsPage = SubmissionPage.verifyOnPage(PersonalDetailsPage)
    const { firstName } = testOffender
    const { lastName } = testOffender
    const dob = new Date(testOffender.dateOfBirth)
    const day = dob.getDate().toString()
    const month = (dob.getMonth() + 1).toString()
    const year = dob.getFullYear().toString()
    personalDetailsPage.completeForm({
      firstName,
      lastName,
      day,
      month,
      year,
    })
    personalDetailsPage.continueButton().click()
    const mentalHealthPage = SubmissionPage.verifyOnPage(MentalHealthPage)
    mentalHealthPage.veryWellRadio().should('exist')
    mentalHealthPage.wellRadio().should('exist')
    mentalHealthPage.okRadio().should('exist')
    mentalHealthPage.notGreatRadio().should('exist')
    mentalHealthPage.strugglingRadio().should('exist')
    mentalHealthPage.okRadio().click()
    mentalHealthPage.continueButton().click()
    const assistancePage = SubmissionPage.verifyOnPage(AssistancePage)
    assistancePage.selectMoney()
    assistancePage.enterMoneyReason('I am having trouble with my budgeting.')
    assistancePage.selectHousing()
    assistancePage.enterHousingReason('I need to find a new place to live.')
    assistancePage.selectEmploymentEduSupport()
    assistancePage.enterEmploymentEduReason('I need to get a job.')
    assistancePage.continueButton().click()
    const additionalQuestionPage = new AdditionalQuestionPage('How was the pottery class?')
    additionalQuestionPage.answerTextarea().type('It was great!')
    additionalQuestionPage.continueButton().click()

    const informPage = SubmissionPage.verifyOnPage(VideoInformPage)
    informPage.continueButton().click()

    cy.visit(`/${testCheckin.uuid}/liveness/record?mock=true`)
    const recordPage = SubmissionPage.verifyOnPage(VideoRecordPage)
    recordPage.simulateCameraAccessButton().click()
    cy.url().should('include', '/outcome/error')
    const outcomePage = SubmissionPage.verifyOnPage(OutcomePage)
    outcomePage.verifyHeadingText('We cannot confirm this is you because an error occurred')
  })

  // default camera not found error
  it('should simulate aws rekognition checks and show appropriate default camera not found error page', () => {
    cy.visit(`/${testCheckin.uuid}`)
    const submissionIndexPage = SubmissionPage.verifyOnPage(CheckinIndexPage)
    cy.contains('h1', 'Check in with your probation officer').should('be.visible')
    submissionIndexPage.startButton().should('contain.text', 'Start now')
    submissionIndexPage.startButton().click()
    const personalDetailsPage = SubmissionPage.verifyOnPage(PersonalDetailsPage)
    const { firstName } = testOffender
    const { lastName } = testOffender
    const dob = new Date(testOffender.dateOfBirth)
    const day = dob.getDate().toString()
    const month = (dob.getMonth() + 1).toString()
    const year = dob.getFullYear().toString()
    personalDetailsPage.completeForm({
      firstName,
      lastName,
      day,
      month,
      year,
    })
    personalDetailsPage.continueButton().click()
    const mentalHealthPage = SubmissionPage.verifyOnPage(MentalHealthPage)
    mentalHealthPage.veryWellRadio().should('exist')
    mentalHealthPage.wellRadio().should('exist')
    mentalHealthPage.okRadio().should('exist')
    mentalHealthPage.notGreatRadio().should('exist')
    mentalHealthPage.strugglingRadio().should('exist')
    mentalHealthPage.okRadio().click()
    mentalHealthPage.continueButton().click()
    const assistancePage = SubmissionPage.verifyOnPage(AssistancePage)
    assistancePage.selectMoney()
    assistancePage.enterMoneyReason('I am having trouble with my budgeting.')
    assistancePage.selectHousing()
    assistancePage.enterHousingReason('I need to find a new place to live.')
    assistancePage.selectEmploymentEduSupport()
    assistancePage.enterEmploymentEduReason('I need to get a job.')
    assistancePage.continueButton().click()
    const additionalQuestionPage = new AdditionalQuestionPage('How was the pottery class?')
    additionalQuestionPage.answerTextarea().type('It was great!')
    additionalQuestionPage.continueButton().click()
    const informPage = SubmissionPage.verifyOnPage(VideoInformPage)
    informPage.continueButton().click()
    cy.visit(`/${testCheckin.uuid}/liveness/record?mock=true`)
    const recordPage = SubmissionPage.verifyOnPage(VideoRecordPage)
    recordPage.simulateDefaultCameraNotFoundButton().click()
    cy.url().should('include', '/outcome/error')
    const outcomePage = SubmissionPage.verifyOnPage(OutcomePage)
    outcomePage.verifyHeadingText('We cannot confirm this is you because an error occurred')
  })

  // generic error and fallback to record a video flow
  it('should simulate aws rekognition generic error and show divert to fallback option', () => {
    cy.task('stubLivenessClientFailure', testCheckin)
    cy.visit(`/${testCheckin.uuid}`)
    const submissionIndexPage = SubmissionPage.verifyOnPage(CheckinIndexPage)
    cy.contains('h1', 'Check in with your probation officer').should('be.visible')
    submissionIndexPage.startButton().should('contain.text', 'Start now')
    submissionIndexPage.startButton().click()
    const personalDetailsPage = SubmissionPage.verifyOnPage(PersonalDetailsPage)
    const { firstName } = testOffender
    const { lastName } = testOffender
    const dob = new Date(testOffender.dateOfBirth)
    const day = dob.getDate().toString()
    const month = (dob.getMonth() + 1).toString()
    const year = dob.getFullYear().toString()
    personalDetailsPage.completeForm({
      firstName,
      lastName,
      day,
      month,
      year,
    })
    personalDetailsPage.continueButton().click()
    const mentalHealthPage = SubmissionPage.verifyOnPage(MentalHealthPage)
    mentalHealthPage.veryWellRadio().should('exist')
    mentalHealthPage.wellRadio().should('exist')
    mentalHealthPage.okRadio().should('exist')
    mentalHealthPage.notGreatRadio().should('exist')
    mentalHealthPage.strugglingRadio().should('exist')
    mentalHealthPage.okRadio().click()
    mentalHealthPage.continueButton().click()
    const assistancePage = SubmissionPage.verifyOnPage(AssistancePage)
    assistancePage.selectMoney()
    assistancePage.enterMoneyReason('I am having trouble with my budgeting.')
    assistancePage.selectHousing()
    assistancePage.enterHousingReason('I need to find a new place to live.')
    assistancePage.selectEmploymentEduSupport()
    assistancePage.enterEmploymentEduReason('I need to get a job.')
    assistancePage.continueButton().click()
    const additionalQuestionPage = new AdditionalQuestionPage('How was the pottery class?')
    additionalQuestionPage.answerTextarea().type('It was great!')
    additionalQuestionPage.continueButton().click()

    const informPage = SubmissionPage.verifyOnPage(VideoInformPage)
    informPage.continueButton().should('exist')
    // we are using a mock component instead of rendering the actual aws rekog screen
    cy.visit(`/${testCheckin.uuid}/liveness/record?mock=true`)
    const recordPage = SubmissionPage.verifyOnPage(VideoRecordPage)
    recordPage.simulateErrorButton().click()
    cy.url().should('include', '/outcome/error')
    const outcomePage = SubmissionPage.verifyOnPage(OutcomePage)
    outcomePage.verifyHeadingText('We cannot confirm this is you because an error occurred')
    outcomePage.verifyAgainButton().should('exist')
    outcomePage.recordVideoInsteadButton().should('exist')
    outcomePage.recordVideoInsteadButton().click()
    cy.url().should('include', '/liveness/fallback-inform')
  })
})
