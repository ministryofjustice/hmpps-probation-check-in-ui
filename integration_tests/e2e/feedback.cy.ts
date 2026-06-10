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
    feedbackPage.selectEaseOfUse('veryEasy')
    feedbackPage.selectGettingSupport('yes')
    feedbackPage.selectImprovement('checkInQuestions')
    feedbackPage.submitFeedback()
    Page.verifyOnPage(FeedbackThankyouPage)
  })
  it('triggers a validation error if a user tries to submit feedback without selecting the ease of use option', () => {
    cy.visit('/feedback')
    const feedbackPage = Page.verifyOnPage(FeedbackPage)
    feedbackPage.selectGettingSupport('yes')
    feedbackPage.selectImprovement('checkInQuestions')
    feedbackPage.submitFeedback()
    feedbackPage.checkOnPage()
    feedbackPage.errorSummary().should('be.visible').and('contain.text', 'Select how easy it was to use online check ins')
    feedbackPage.errorMessage().should('be.visible').and('contain.text', 'Select how easy it was to use online check ins')
    Page.verifyOnPage(FeedbackThankyouPage)
  })
})
