import SubmissionPage, { PageElement } from './submissionPage'

export default class ConfirmationPage extends SubmissionPage {
  constructor() {
    super('Check in completed')
  }

  panel = (): PageElement => cy.get('.govuk-panel')

  panelTitle = (): PageElement => cy.get('.govuk-panel__title')
}
