import SubmissionPage, { PageElement } from './submissionPage'

export default class VerificationUnavailablePage extends SubmissionPage {
  constructor() {
    super('We could not check your details because there was a technical problem')
  }

  tryAgainButton = (): PageElement => cy.contains('a', 'Try again')
}
