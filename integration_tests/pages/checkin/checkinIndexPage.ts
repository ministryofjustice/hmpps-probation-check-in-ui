import CheckinPage, { PageElement } from './checkinPage'

export default class CheckinIndexPage extends CheckinPage {
  constructor() {
    super('Check in with your probation officer')
  }

  startButton = (): PageElement => cy.contains('button', 'Start now')
}
