import CheckinPage, { PageElement } from './checkinPage'

export default class ConfirmationPage extends CheckinPage {
  constructor() {
    super('Check in completed')
  }

  panelBody = (): PageElement => cy.get('.govuk-panel__body')
}
