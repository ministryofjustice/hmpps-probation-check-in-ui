import Page from '../pages/page'
import FeedbackPage from '../pages/feedbackPage'
import FeedbackThankyouPage from '../pages/feedbackThankyouPage'

context('Feedback', () => {
  beforeEach(() => {
    cy.task('stubAuthToken')
    cy.task('stubSubmitFeedback')
  })

  it('allows a user to submit feedback', () => {
    cy.visit('/feedback')
    const feedbackPage = Page.verifyOnPage(FeedbackPage)
    cy.contains('legend', 'Do online check ins help you feel supported by probation?').should('be.visible')
    cy.contains(
      'legend',
      'Does using online check ins mean you need to get in touch with your probation officer less?',
    ).should('be.visible')
    cy.contains('legend', 'Are you getting the support you need from probation?').should('not.exist')
    feedbackPage.selectEaseOfUse('veryEasy')
    feedbackPage.selectHelpsFeelSupported('yes')
    feedbackPage.selectLessContactNeeded('no')
    feedbackPage.selectImprovement('checkInQuestions')
    feedbackPage.submitFeedback()
    Page.verifyOnPage(FeedbackThankyouPage)
  })

  it('allows feedback to be submitted without answering either question', () => {
    cy.visit('/feedback')
    const feedbackPage = Page.verifyOnPage(FeedbackPage)
    feedbackPage.selectEaseOfUse('veryEasy')
    feedbackPage.submitFeedback()
    Page.verifyOnPage(FeedbackThankyouPage)
  })

  it('triggers a validation error if a user tries to submit feedback without selecting the ease of use option', () => {
    cy.visit('/feedback')
    const feedbackPage = Page.verifyOnPage(FeedbackPage)
    feedbackPage.selectImprovement('checkInQuestions')
    feedbackPage.submitFeedback()
    feedbackPage.checkOnPage()
    feedbackPage
      .errorSummary()
      .should('be.visible')
      .and('contain.text', 'Select how easy it was to use online check ins')
    feedbackPage
      .errorMessage()
      .should('be.visible')
      .and('contain.text', 'Select how easy it was to use online check ins')
  })
})
