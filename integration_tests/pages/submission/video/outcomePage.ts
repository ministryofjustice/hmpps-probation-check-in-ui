import SubmissionPage, { PageElement } from '../submissionPage'

export default class OutcomePage extends SubmissionPage {
  constructor() {
    super('you')
  }

  verifyHeadingText(expectedText: string) {
    cy.contains('h1', expectedText).should('be.visible')
  }

  verifyIntroText(expectedText: string) {
    cy.contains('p', expectedText).should('be.visible')
  }

  verifyAgainButton = (): PageElement => cy.contains('a.govuk-button', 'Verify identity again')

  recordVideoInsteadButton = (): PageElement => cy.contains('a.govuk-button', 'Record a video instead')
}
