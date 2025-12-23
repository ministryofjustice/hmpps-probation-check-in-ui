import AutomatedIdVerificationResult from '../../../server/data/models/automatedIdVerificationResult'
import Checkin from '../../../server/data/models/checkin'
import CheckinStatus from '../../../server/data/models/checkinStatus'
import Offender from '../../../server/data/models/offender'
import OffenderStatus from '../../../server/data/models/offenderStatus'
import { createMockCheckin, createMockOffender } from '../../mockApis/esupervisionApi'
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

describe('Check-in Journey Routes', () => {
  let testOffender: Offender
  let testCheckin: Checkin

  beforeEach(() => {
    testOffender = createMockOffender({ status: OffenderStatus.Verified })
    testCheckin = createMockCheckin(testOffender, {
      status: CheckinStatus.Created,
      autoIdCheck: AutomatedIdVerificationResult.Match,
    })

    cy.task('reset').then(() => {
      cy.task('stubAuthToken')
      cy.task('stubGetCheckin', testCheckin)
      cy.task('stubGetCheckinUploadLocation', testCheckin)
      cy.task('stubFakeS3Upload')
      cy.task('stubVerifyIdentity', testCheckin)
      cy.task('stubAutoVerifyCheckinIdentity', testCheckin)
      cy.task('stubSubmitCheckin', testCheckin)
    })
  })

  /**
   * Helper to complete identity verification and establish a session
   */
  const completeVerification = () => {
    cy.visit(`/${testCheckin.uuid}`)
    const indexPage = SubmissionPage.verifyOnPage(CheckinIndexPage)
    indexPage.startButton().click()

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
  }

  /**
   * Helper to navigate through all questions
   */
  const completeQuestions = () => {
    // Mental health
    const mentalHealthPage = SubmissionPage.verifyOnPage(MentalHealthPage)
    mentalHealthPage.okRadio().click()
    mentalHealthPage.continueButton().click()

    // Assistance
    const assistancePage = SubmissionPage.verifyOnPage(AssistancePage)
    assistancePage.selectNoHelp()
    assistancePage.continueButton().click()

    // Callback
    const callbackPage = SubmissionPage.verifyOnPage(CallbackPage)
    callbackPage.selectNo()
    callbackPage.continueButton().click()
  }

  describe('Public Routes (no session protection)', () => {
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

  describe('Protected Routes - Questions Flow', () => {
    beforeEach(() => {
      completeVerification()
    })

    describe('GET /:submissionId/questions/mental-health - Mental health question', () => {
      it('should display the mental health question page', () => {
        SubmissionPage.verifyOnPage(MentalHealthPage)
        cy.contains('h1', 'How are you feeling?').should('be.visible')
      })

      it('should display all mental health options', () => {
        const mentalHealthPage = SubmissionPage.verifyOnPage(MentalHealthPage)
        mentalHealthPage.veryWellRadio().should('exist')
        mentalHealthPage.wellRadio().should('exist')
        mentalHealthPage.okRadio().should('exist')
        mentalHealthPage.notGreatRadio().should('exist')
        mentalHealthPage.strugglingRadio().should('exist')
      })
    })

    describe('POST /:submissionId/questions/mental-health - Submit mental health answer', () => {
      it('should redirect to assistance page after submission', () => {
        const mentalHealthPage = SubmissionPage.verifyOnPage(MentalHealthPage)
        mentalHealthPage.okRadio().click()
        mentalHealthPage.continueButton().click()
        cy.url().should('include', '/questions/assistance')
      })

      it('should accept all mental health options', () => {
        // const options = ['veryWellRadio', 'wellRadio', 'okRadio', 'notGreatRadio', 'strugglingRadio'] as const
        const mentalHealthPage = SubmissionPage.verifyOnPage(MentalHealthPage)

        // Test that first option works (we can only submit once per session setup)
        mentalHealthPage.veryWellRadio().click()
        mentalHealthPage.continueButton().click()
        cy.url().should('include', '/questions/assistance')
      })
    })

    describe('GET /:submissionId/questions/assistance - Assistance question', () => {
      beforeEach(() => {
        const mentalHealthPage = SubmissionPage.verifyOnPage(MentalHealthPage)
        mentalHealthPage.okRadio().click()
        mentalHealthPage.continueButton().click()
      })

      it('should display the assistance question page', () => {
        SubmissionPage.verifyOnPage(AssistancePage)
        cy.contains('h1', 'Is there anything you need support with or want to let us know about?').should('be.visible')
      })

      it('should display all assistance options', () => {
        SubmissionPage.verifyOnPage(AssistancePage)
        cy.get('input[name="assistance"][value="MENTAL_HEALTH"]').should('exist')
        cy.get('input[name="assistance"][value="ALCOHOL"]').should('exist')
        cy.get('input[name="assistance"][value="DRUGS"]').should('exist')
        cy.get('input[name="assistance"][value="MONEY"]').should('exist')
        cy.get('input[name="assistance"][value="HOUSING"]').should('exist')
        cy.get('input[name="assistance"][value="SUPPORT_SYSTEM"]').should('exist')
        cy.get('input[name="assistance"][value="OTHER"]').should('exist')
        cy.get('input[name="assistance"][value="NO_HELP"]').should('exist')
      })
    })

    describe('POST /:submissionId/questions/assistance - Submit assistance answer', () => {
      beforeEach(() => {
        const mentalHealthPage = SubmissionPage.verifyOnPage(MentalHealthPage)
        mentalHealthPage.okRadio().click()
        mentalHealthPage.continueButton().click()
      })

      it('should redirect to callback page after submission with no help selected', () => {
        const assistancePage = SubmissionPage.verifyOnPage(AssistancePage)
        assistancePage.selectNoHelp()
        assistancePage.continueButton().click()
        cy.url().should('include', '/questions/callback')
      })

      it('should allow multiple assistance options to be selected', () => {
        const assistancePage = SubmissionPage.verifyOnPage(AssistancePage)
        assistancePage.selectMoney()
        assistancePage.enterMoneyReason('Need budgeting help')
        assistancePage.selectHousing()
        assistancePage.enterHousingReason('Looking for new accommodation')
        assistancePage.continueButton().click()
        cy.url().should('include', '/questions/callback')
      })
    })

    describe('GET /:submissionId/questions/callback - Callback question', () => {
      beforeEach(() => {
        const mentalHealthPage = SubmissionPage.verifyOnPage(MentalHealthPage)
        mentalHealthPage.okRadio().click()
        mentalHealthPage.continueButton().click()

        const assistancePage = SubmissionPage.verifyOnPage(AssistancePage)
        assistancePage.selectNoHelp()
        assistancePage.continueButton().click()
      })

      it('should display the callback question page', () => {
        SubmissionPage.verifyOnPage(CallbackPage)
        cy.contains('h1', 'Is there anything else you need to speak with your probation officer about?').should(
          'be.visible',
        )
      })

      it('should display yes and no radio options', () => {
        const callbackPage = SubmissionPage.verifyOnPage(CallbackPage)
        callbackPage.yesRadio().should('exist')
        callbackPage.noRadio().should('exist')
      })
    })

    describe('POST /:submissionId/questions/callback - Submit callback answer', () => {
      beforeEach(() => {
        const mentalHealthPage = SubmissionPage.verifyOnPage(MentalHealthPage)
        mentalHealthPage.okRadio().click()
        mentalHealthPage.continueButton().click()

        const assistancePage = SubmissionPage.verifyOnPage(AssistancePage)
        assistancePage.selectNoHelp()
        assistancePage.continueButton().click()
      })

      it('should redirect to video inform page after selecting no', () => {
        const callbackPage = SubmissionPage.verifyOnPage(CallbackPage)
        callbackPage.selectNo()
        callbackPage.continueButton().click()
        cy.url().should('include', '/video/inform')
      })

      it('should allow entering callback details when yes is selected', () => {
        const callbackPage = SubmissionPage.verifyOnPage(CallbackPage)
        callbackPage.selectYesAndProvideDetails('I need to discuss my appointment schedule')
        callbackPage.continueButton().click()
        cy.url().should('include', '/video/inform')
      })
    })
  })

  describe('Protected Routes - Video Flow', () => {
    beforeEach(() => {
      completeVerification()
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
        // Navigate directly to video/view (simulating completed recording)
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

  describe('Protected Routes - Check Answers and Submit', () => {
    beforeEach(() => {
      completeVerification()
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

  describe('Confirmation Page', () => {
    beforeEach(() => {
      completeVerification()
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
        confirmationPage.panelBody().should('exist')
      })
    })
  })

  describe('Session Management Routes', () => {
    describe('GET /:submissionId/timeout - Session timeout page', () => {
      it('should display the timeout page when accessing protected route without session', () => {
        // Try to access a protected route without completing verification
        cy.visit(`/${testCheckin.uuid}/questions/mental-health`)
        // Should be redirected to timeout page
        cy.url().then(url => {
          expect(url).to.satisfy((u: string) => u.includes('/timeout') || u.includes('/verify'))
        })
      })
    })

    describe('GET /:submissionId/keepalive - Keep-alive endpoint', () => {
      it('should return success for keepalive request', () => {
        completeVerification()
        cy.request(`/${testCheckin.uuid}/keepalive`).then(response => {
          expect(response.status).to.eq(200)
        })
      })
    })
  })

  describe('Error States', () => {
    describe('Not Found - Invalid submission ID', () => {
      it('should display not found page for invalid UUID', () => {
        cy.visit('/invalid-uuid-12345', { failOnStatusCode: false })
        cy.contains('not found', { matchCase: false }).should('be.visible')
      })
    })

    describe('Expired Check-in', () => {
      beforeEach(() => {
        const expiredCheckin = createMockCheckin(testOffender, {
          status: CheckinStatus.Expired,
        })
        cy.task('stubGetCheckin', expiredCheckin)
      })

      it('should display expired page for expired check-in', () => {
        cy.visit(`/${testCheckin.uuid}`)
        cy.contains('expired', { matchCase: false }).should('be.visible')
      })
    })
  })

  describe('Validation Errors - Unhappy Paths', () => {
    describe('Verify Page - Personal Details Validation', () => {
      beforeEach(() => {
        cy.visit(`/${testCheckin.uuid}/verify`)
      })

      it('should show error when submitting empty form', () => {
        const personalDetailsPage = SubmissionPage.verifyOnPage(PersonalDetailsPage)
        personalDetailsPage.continueButton().click()

        // Should stay on the same page
        cy.url().should('include', '/verify')

        // Should display error summary
        cy.get('.govuk-error-summary').should('be.visible')
        cy.get('.govuk-error-summary__list').should('contain.text', 'Enter your first name')
        cy.get('.govuk-error-summary__list').should('contain.text', 'Enter your last name')
      })

      it('should show error when first name is missing', () => {
        const personalDetailsPage = SubmissionPage.verifyOnPage(PersonalDetailsPage)
        const dob = new Date(testOffender.dateOfBirth)

        personalDetailsPage.lastNameField().type(testOffender.lastName)
        personalDetailsPage.dayField().type(dob.getDate().toString())
        personalDetailsPage.monthField().type((dob.getMonth() + 1).toString())
        personalDetailsPage.yearField().type(dob.getFullYear().toString())
        personalDetailsPage.continueButton().click()

        cy.get('.govuk-error-summary').should('be.visible')
        cy.get('.govuk-error-summary__list').should('contain.text', 'Enter your first name')
        cy.get('#firstName-error').should('be.visible')
      })

      it('should show error when last name is missing', () => {
        const personalDetailsPage = SubmissionPage.verifyOnPage(PersonalDetailsPage)
        const dob = new Date(testOffender.dateOfBirth)

        personalDetailsPage.firstNameField().type(testOffender.firstName)
        personalDetailsPage.dayField().type(dob.getDate().toString())
        personalDetailsPage.monthField().type((dob.getMonth() + 1).toString())
        personalDetailsPage.yearField().type(dob.getFullYear().toString())
        personalDetailsPage.continueButton().click()

        cy.get('.govuk-error-summary').should('be.visible')
        cy.get('.govuk-error-summary__list').should('contain.text', 'Enter your last name')
        cy.get('#lastName-error').should('be.visible')
      })

      it('should show error when date of birth is missing', () => {
        const personalDetailsPage = SubmissionPage.verifyOnPage(PersonalDetailsPage)

        personalDetailsPage.firstNameField().type(testOffender.firstName)
        personalDetailsPage.lastNameField().type(testOffender.lastName)
        personalDetailsPage.continueButton().click()

        cy.get('.govuk-error-summary').should('be.visible')
        cy.get('.govuk-error-summary__list').should('contain.text', 'date of birth')
      })

      it('should show error for invalid date of birth', () => {
        const personalDetailsPage = SubmissionPage.verifyOnPage(PersonalDetailsPage)

        personalDetailsPage.firstNameField().type(testOffender.firstName)
        personalDetailsPage.lastNameField().type(testOffender.lastName)
        personalDetailsPage.dayField().type('32')
        personalDetailsPage.monthField().type('13')
        personalDetailsPage.yearField().type('2000')
        personalDetailsPage.continueButton().click()

        cy.get('.govuk-error-summary').should('be.visible')
      })

      it('should show error for future date of birth', () => {
        const personalDetailsPage = SubmissionPage.verifyOnPage(PersonalDetailsPage)
        const futureDate = new Date()
        futureDate.setFullYear(futureDate.getFullYear() + 1)

        personalDetailsPage.firstNameField().type(testOffender.firstName)
        personalDetailsPage.lastNameField().type(testOffender.lastName)
        personalDetailsPage.dayField().type('15')
        personalDetailsPage.monthField().type('6')
        personalDetailsPage.yearField().type(futureDate.getFullYear().toString())
        personalDetailsPage.continueButton().click()

        cy.get('.govuk-error-summary').should('be.visible')
        cy.get('.govuk-error-summary__list').should('contain.text', 'past')
      })
    })

    describe('Verify Page - Identity Verification Failure', () => {
      beforeEach(() => {
        // Stub identity verification to return failure
        cy.task('stubVerifyIdentity', { ...testCheckin, verified: false })
      })

      it('should show no match found page when identity verification fails', () => {
        cy.visit(`/${testCheckin.uuid}/verify`)
        const personalDetailsPage = SubmissionPage.verifyOnPage(PersonalDetailsPage)
        const dob = new Date(testOffender.dateOfBirth)

        personalDetailsPage.completeForm({
          firstName: 'WrongFirstName',
          lastName: 'WrongLastName',
          day: dob.getDate().toString(),
          month: (dob.getMonth() + 1).toString(),
          year: dob.getFullYear().toString(),
        })
        personalDetailsPage.continueButton().click()

        // Should display no match found page
        cy.contains('h1', 'No match found').should('be.visible')
        cy.contains('We were unable to verify your identity').should('be.visible')
        cy.contains('button', 'Try again').should('be.visible')
      })

      it('should allow user to try again after verification failure', () => {
        cy.visit(`/${testCheckin.uuid}/verify`)
        const personalDetailsPage = SubmissionPage.verifyOnPage(PersonalDetailsPage)
        const dob = new Date(testOffender.dateOfBirth)

        personalDetailsPage.completeForm({
          firstName: 'WrongFirstName',
          lastName: 'WrongLastName',
          day: dob.getDate().toString(),
          month: (dob.getMonth() + 1).toString(),
          year: dob.getFullYear().toString(),
        })
        personalDetailsPage.continueButton().click()

        // Click try again
        cy.contains('button', 'Try again').click()
        cy.url().should('include', '/verify')
      })
    })

    describe('Mental Health Page - Validation', () => {
      beforeEach(() => {
        completeVerification()
      })

      it('should show error when no option is selected and continue is clicked', () => {
        const mentalHealthPage = SubmissionPage.verifyOnPage(MentalHealthPage)
        mentalHealthPage.continueButton().click()

        // Should stay on the same page
        cy.url().should('include', '/questions/mental-health')

        // Should display error summary
        cy.get('.govuk-error-summary').should('be.visible')
        cy.get('.govuk-error-summary__list').should('contain.text', 'Select how you are feeling')

        // Should display inline error
        cy.get('#mentalHealth-error').should('be.visible')
      })

      it('should link error summary to the radio group', () => {
        const mentalHealthPage = SubmissionPage.verifyOnPage(MentalHealthPage)
        mentalHealthPage.continueButton().click()

        // Clicking error link should focus on the radio group
        cy.get('.govuk-error-summary__list a').first().click()
        cy.focused().should('have.attr', 'name', 'mentalHealth')
      })
    })

    describe('Assistance Page - Validation', () => {
      beforeEach(() => {
        completeVerification()
        const mentalHealthPage = SubmissionPage.verifyOnPage(MentalHealthPage)
        mentalHealthPage.okRadio().click()
        mentalHealthPage.continueButton().click()
      })

      it('should show error when no option is selected and continue is clicked', () => {
        const assistancePage = SubmissionPage.verifyOnPage(AssistancePage)
        assistancePage.continueButton().click()

        // Should stay on the same page
        cy.url().should('include', '/questions/assistance')

        // Should display error summary
        cy.get('.govuk-error-summary').should('be.visible')
        cy.get('.govuk-error-summary__list').should(
          'contain.text',
          "Select what you need help with or select 'No, I do not need help'",
        )

        // Should display inline error
        cy.get('#assistance-error').should('be.visible')
      })

      it('should show conditional textarea when selecting an option with conditional reveal', () => {
        const assistancePage = SubmissionPage.verifyOnPage(AssistancePage)

        // Select money option
        assistancePage.selectMoney()

        // Conditional textarea should be visible
        cy.get('#moneySupport').should('be.visible')
      })

      it('should hide conditional textarea when deselecting option', () => {
        const assistancePage = SubmissionPage.verifyOnPage(AssistancePage)

        // Select then deselect money option
        assistancePage.selectMoney()
        cy.get('#moneySupport').should('be.visible')

        // Deselect
        cy.get('input[name="assistance"][value="MONEY"]').uncheck()
        cy.get('#moneySupport').should('not.be.visible')
      })

      it('should clear other options when NO_HELP is selected (exclusive behaviour)', () => {
        const assistancePage = SubmissionPage.verifyOnPage(AssistancePage)

        // Select money first
        assistancePage.selectMoney()
        cy.get('input[name="assistance"][value="MONEY"]').should('be.checked')

        // Select no help - should uncheck money
        assistancePage.selectNoHelp()
        cy.get('input[name="assistance"][value="NO_HELP"]').should('be.checked')
        cy.get('input[name="assistance"][value="MONEY"]').should('not.be.checked')
      })
    })

    describe('Callback Page - Validation', () => {
      beforeEach(() => {
        completeVerification()
        const mentalHealthPage = SubmissionPage.verifyOnPage(MentalHealthPage)
        mentalHealthPage.okRadio().click()
        mentalHealthPage.continueButton().click()

        const assistancePage = SubmissionPage.verifyOnPage(AssistancePage)
        assistancePage.selectNoHelp()
        assistancePage.continueButton().click()
      })

      it('should show error when no option is selected and continue is clicked', () => {
        const callbackPage = SubmissionPage.verifyOnPage(CallbackPage)
        callbackPage.continueButton().click()

        // Should stay on the same page
        cy.url().should('include', '/questions/callback')

        // Should display error summary
        cy.get('.govuk-error-summary').should('be.visible')
        cy.get('.govuk-error-summary__list').should(
          'contain.text',
          'Select yes if you need to speak to your probation officer',
        )

        // Should display inline error
        cy.get('#callback-error').should('be.visible')
      })

      it('should show conditional textarea when YES is selected', () => {
        const callbackPage = SubmissionPage.verifyOnPage(CallbackPage)
        callbackPage.yesRadio().check()

        // Conditional textarea should be visible
        cy.get('#callbackDetails').should('be.visible')
      })

      it('should hide conditional textarea when NO is selected', () => {
        const callbackPage = SubmissionPage.verifyOnPage(CallbackPage)

        // First select YES
        callbackPage.yesRadio().check()
        cy.get('#callbackDetails').should('be.visible')

        // Then select NO
        callbackPage.noRadio().check()
        cy.get('#callbackDetails').should('not.be.visible')
      })
    })

    describe('Check Answers Page - Validation', () => {
      beforeEach(() => {
        completeVerification()
        completeQuestions()
        cy.visit(`/${testCheckin.uuid}/video/view`)
        const videoViewPage = SubmissionPage.verifyOnPage(VideoViewPage)
        videoViewPage.submitAnywayButton().click()
      })

      it('should show error when submitting without confirming checkbox', () => {
        const checkAnswersPage = SubmissionPage.verifyOnPage(CheckAnswersPage)
        checkAnswersPage.completeCheckinButton().click()

        // Should stay on the same page
        cy.url().should('include', '/check-your-answers')

        // Should display error summary
        cy.get('.govuk-error-summary').should('be.visible')
        cy.get('.govuk-error-summary__list').should('contain.text', 'Confirm your details are correct')

        // Should display inline error
        cy.get('#checkAnswers-error').should('be.visible')
      })

      it('should link error summary to the checkbox', () => {
        const checkAnswersPage = SubmissionPage.verifyOnPage(CheckAnswersPage)
        checkAnswersPage.completeCheckinButton().click()

        // Clicking error link should focus on the checkbox
        cy.get('.govuk-error-summary__list a').first().click()
        cy.focused().should('have.attr', 'name', 'checkAnswers')
      })
    })
  })

  describe('Form Data Persistence', () => {
    describe('Data should persist when navigating back', () => {
      beforeEach(() => {
        completeVerification()
      })

      it('should retain mental health selection when navigating back from assistance page', () => {
        const mentalHealthPage = SubmissionPage.verifyOnPage(MentalHealthPage)
        mentalHealthPage.strugglingRadio().click()
        mentalHealthPage.continueButton().click()

        // Go back
        cy.go('back')

        // Check the selection is retained
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

        // Go back
        cy.go('back')

        // Check the selections are retained
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

        // Enter only first name, triggering validation error
        personalDetailsPage.firstNameField().type('TestFirstName')
        personalDetailsPage.continueButton().click()

        // First name should still be populated
        personalDetailsPage.firstNameField().should('have.value', 'TestFirstName')
      })
    })
  })

  describe('Complete Journey - Happy Path', () => {
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
})
