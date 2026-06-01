import SubmissionPage, { PageElement } from '../submissionPage'

export default class VideoViewPage extends SubmissionPage {
  constructor() {
    super('you')
  }

  verifyHeadingText(expectedText: string) {
    cy.contains('h1', expectedText).should('be.visible')
  }

  continueButton = (): PageElement => cy.contains('a.govuk-button', 'Continue')

  tryAgainButton = (): PageElement => cy.contains('a.govuk-button', 'Try again')

  submitAnywayButton = (): PageElement => cy.contains('a.govuk-button--secondary', 'Submit anyway')
}
