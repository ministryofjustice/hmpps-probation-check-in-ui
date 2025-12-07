import CheckinPage, { PageElement } from '../checkinPage'

export default class VideoInformPage extends CheckinPage {
  constructor() {
    super('Confirm your identity')
  }

  continueButton = (): PageElement => cy.contains('a.govuk-button', 'Continue')
}
