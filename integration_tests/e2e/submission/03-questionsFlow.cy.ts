import AssistancePage from '../../pages/submission/assistancePage'
import CallbackPage from '../../pages/submission/callbackPage'
import MentalHealthPage from '../../pages/submission/mentalHealthPage'
import SubmissionPage from '../../pages/submission/submissionPage'
import { createTestFixtures, setupCommonStubs, completeVerification, Checkin, Offender } from './_support'

describe('Questions Flow', () => {
  let testOffender: Offender
  let testCheckin: Checkin

  beforeEach(() => {
    const fixtures = createTestFixtures()
    testOffender = fixtures.testOffender
    testCheckin = fixtures.testCheckin
    setupCommonStubs(testCheckin)
  })

  describe('Mental Health Question', () => {
    beforeEach(() => {
      completeVerification(testCheckin, testOffender)
    })

    describe('GET /:submissionId/questions/mental-health', () => {
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

    describe('POST /:submissionId/questions/mental-health', () => {
      it('should redirect to assistance page after submission', () => {
        const mentalHealthPage = SubmissionPage.verifyOnPage(MentalHealthPage)
        mentalHealthPage.okRadio().click()
        mentalHealthPage.continueButton().click()
        cy.url().should('include', '/questions/assistance')
      })

      it('should accept all mental health options', () => {
        const mentalHealthPage = SubmissionPage.verifyOnPage(MentalHealthPage)
        mentalHealthPage.veryWellRadio().click()
        mentalHealthPage.continueButton().click()
        cy.url().should('include', '/questions/assistance')
      })
    })
  })

  describe('Assistance Question', () => {
    beforeEach(() => {
      completeVerification(testCheckin, testOffender)
      const mentalHealthPage = SubmissionPage.verifyOnPage(MentalHealthPage)
      mentalHealthPage.okRadio().click()
      mentalHealthPage.continueButton().click()
    })

    describe('GET /:submissionId/questions/assistance', () => {
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

    describe('POST /:submissionId/questions/assistance', () => {
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
  })

  describe('Callback Question', () => {
    beforeEach(() => {
      completeVerification(testCheckin, testOffender)
      const mentalHealthPage = SubmissionPage.verifyOnPage(MentalHealthPage)
      mentalHealthPage.okRadio().click()
      mentalHealthPage.continueButton().click()

      const assistancePage = SubmissionPage.verifyOnPage(AssistancePage)
      assistancePage.selectNoHelp()
      assistancePage.continueButton().click()
    })

    describe('GET /:submissionId/questions/callback', () => {
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

    describe('POST /:submissionId/questions/callback', () => {
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
})
