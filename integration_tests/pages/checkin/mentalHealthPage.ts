import CheckinPage, { PageElement } from './checkinPage'

export default class MentalHealthPage extends CheckinPage {
  constructor() {
    super('How are you feeling?')
  }

  veryWellRadio = (): PageElement => cy.get('input[name="mentalHealth"][value="VERY_WELL"]')

  wellRadio = (): PageElement => cy.get('input[name="mentalHealth"][value="WELL"]')

  okRadio = (): PageElement => cy.get('input[name="mentalHealth"][value="OK"]')

  notGreatRadio = (): PageElement => cy.get('input[name="mentalHealth"][value="NOT_GREAT"]')

  strugglingRadio = (): PageElement => cy.get('input[name="mentalHealth"][value="STRUGGLING"]')

  continueButton = (): PageElement => cy.contains('button', 'Continue')
}
