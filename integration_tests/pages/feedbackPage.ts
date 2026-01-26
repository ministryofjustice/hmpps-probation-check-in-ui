import Page, { PageElement } from './page'
import type { Improvement } from '../../server/data/models/feedback'

export default class FeedbackPage extends Page {
  constructor() {
    super('Give feedback about online check ins')
  }

  selectEaseOfUse(value: string): void {
    cy.get('input[name="howEasy"]').check(value)
  }

  selectGettingSupport(value: 'yes' | 'no'): void {
    cy.get('input[name="gettingSupport"]').check(value)
  }

  selectImprovement(value: Improvement): void {
    cy.get('input[name="improvements"]').check(value)
  }

  submitButton(): PageElement {
    return cy.get('button').contains('Submit feedback')
  }

  submitFeedback(): void {
    this.submitButton().click()
  }
}
