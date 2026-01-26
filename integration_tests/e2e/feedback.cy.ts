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
})
