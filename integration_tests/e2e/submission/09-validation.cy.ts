import AssistancePage from '../../pages/submission/assistancePage'
import CallbackPage from '../../pages/submission/callbackPage'
import CheckAnswersPage from '../../pages/submission/checkAnswersPage'
import MentalHealthPage from '../../pages/submission/mentalHealthPage'
import PersonalDetailsPage from '../../pages/submission/personalDetailsPage'
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

describe('Validation Errors', () => {
  let testOffender: Offender
  let testCheckin: Checkin

  beforeEach(() => {
    const fixtures = createTestFixtures()
    testOffender = fixtures.testOffender
    testCheckin = fixtures.testCheckin
    setupCommonStubs(testCheckin)
  })

  describe('Verify Page - Personal Details Validation', () => {
    beforeEach(() => {
      cy.visit(`/${testCheckin.uuid}/verify`)
    })

    it('should show error when submitting empty form', () => {
      const personalDetailsPage = SubmissionPage.verifyOnPage(PersonalDetailsPage)
      personalDetailsPage.continueButton().click()

      cy.url().should('include', '/verify')
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

      cy.contains('h1', 'No match found').should('be.visible')
      cy.contains('We were unable to verify your identity').should('be.visible')
      cy.contains('a.govuk-button', 'Try again').should('be.visible')
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

      cy.contains('a.govuk-button', 'Try again').click()
      cy.url().should('include', '/verify')
    })
  })

  describe('Mental Health Page - Validation', () => {
    beforeEach(() => {
      completeVerification(testCheckin, testOffender)
    })

    it('should show error when no option is selected and continue is clicked', () => {
      const mentalHealthPage = SubmissionPage.verifyOnPage(MentalHealthPage)
      mentalHealthPage.continueButton().click()

      cy.url().should('include', '/questions/mental-health')
      cy.get('.govuk-error-summary').should('be.visible')
      cy.get('.govuk-error-summary__list').should('contain.text', 'Select how you are feeling')
      cy.get('#mentalHealth-error').should('be.visible')
    })

    it('should link error summary to the radio group', () => {
      const mentalHealthPage = SubmissionPage.verifyOnPage(MentalHealthPage)
      mentalHealthPage.continueButton().click()

      cy.get('.govuk-error-summary__list a').first().click()
      cy.focused().should('have.attr', 'name', 'mentalHealth')
    })
  })

  describe('Assistance Page - Validation', () => {
    beforeEach(() => {
      completeVerification(testCheckin, testOffender)
      const mentalHealthPage = SubmissionPage.verifyOnPage(MentalHealthPage)
      mentalHealthPage.okRadio().click()
      mentalHealthPage.continueButton().click()
    })

    it('should show error when no option is selected and continue is clicked', () => {
      const assistancePage = SubmissionPage.verifyOnPage(AssistancePage)
      assistancePage.continueButton().click()

      cy.url().should('include', '/questions/assistance')
      cy.get('.govuk-error-summary').should('be.visible')
      cy.get('.govuk-error-summary__list').should(
        'contain.text',
        "Select what you need help with or select 'No, I do not need help'",
      )
      cy.get('#assistance-error').should('be.visible')
    })

    it('should show conditional textarea when selecting an option with conditional reveal', () => {
      const assistancePage = SubmissionPage.verifyOnPage(AssistancePage)
      assistancePage.selectMoney()
      cy.get('#moneySupport').should('be.visible')
    })

    it('should hide conditional textarea when deselecting option', () => {
      const assistancePage = SubmissionPage.verifyOnPage(AssistancePage)
      assistancePage.selectMoney()
      cy.get('#moneySupport').should('be.visible')

      cy.get('input[name="assistance"][value="MONEY"]').uncheck()
      cy.get('#moneySupport').should('not.be.visible')
    })

    it('should clear other options when NO_HELP is selected (exclusive behaviour)', () => {
      const assistancePage = SubmissionPage.verifyOnPage(AssistancePage)
      assistancePage.selectMoney()
      cy.get('input[name="assistance"][value="MONEY"]').should('be.checked')

      assistancePage.selectNoHelp()
      cy.get('input[name="assistance"][value="NO_HELP"]').should('be.checked')
      cy.get('input[name="assistance"][value="MONEY"]').should('not.be.checked')
    })
  })

  describe('Callback Page - Validation', () => {
    beforeEach(() => {
      completeVerification(testCheckin, testOffender)
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

      cy.url().should('include', '/questions/callback')
      cy.get('.govuk-error-summary').should('be.visible')
      cy.get('.govuk-error-summary__list').should(
        'contain.text',
        'Select yes if you need to speak to your probation officer',
      )
      cy.get('#callback-error').should('be.visible')
    })

    it('should show conditional textarea when YES is selected', () => {
      const callbackPage = SubmissionPage.verifyOnPage(CallbackPage)
      callbackPage.yesRadio().check()
      cy.get('#callbackDetails').should('be.visible')
    })

    it('should hide conditional textarea when NO is selected', () => {
      const callbackPage = SubmissionPage.verifyOnPage(CallbackPage)
      callbackPage.yesRadio().check()
      cy.get('#callbackDetails').should('be.visible')

      callbackPage.noRadio().check()
      cy.get('#callbackDetails').should('not.be.visible')
    })
  })

  describe('Check Answers Page - Validation', () => {
    beforeEach(() => {
      completeVerification(testCheckin, testOffender)
      completeQuestions()
      cy.visit(`/${testCheckin.uuid}/video/view`)
      const videoViewPage = SubmissionPage.verifyOnPage(VideoViewPage)
      videoViewPage.submitAnywayButton().click()
    })

    it('should show error when submitting without confirming checkbox', () => {
      const checkAnswersPage = SubmissionPage.verifyOnPage(CheckAnswersPage)
      checkAnswersPage.completeCheckinButton().click()

      cy.url().should('include', '/check-your-answers')
      cy.get('.govuk-error-summary').should('be.visible')
      cy.get('.govuk-error-summary__list').should('contain.text', 'Confirm your details are correct')
      cy.get('#checkAnswers-error').should('be.visible')
    })

    it('should link error summary to the checkbox', () => {
      const checkAnswersPage = SubmissionPage.verifyOnPage(CheckAnswersPage)
      checkAnswersPage.completeCheckinButton().click()

      cy.get('.govuk-error-summary__list a').first().click()
      cy.focused().should('have.attr', 'name', 'checkAnswers')
    })
  })
})
