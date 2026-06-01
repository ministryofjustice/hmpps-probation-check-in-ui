export type PageElement = Cypress.Chainable<JQuery>

export default abstract class SubmissionPage {
  static verifyOnPage<T>(constructor: new () => T): T {
    return new constructor()
  }

  protected constructor(private readonly title: string) {
    this.checkOnPage()
  }

  checkOnPage(): void {
    cy.get('h1').contains(this.title)
  }
}

Cypress.on('uncaught:exception', err => {
  if (err.message.includes('Cannot cancel a locked stream')) {
    return false
  }
  return true
})
