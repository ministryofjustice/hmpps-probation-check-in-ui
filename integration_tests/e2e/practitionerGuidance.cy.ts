import Page from '../pages/page'
import PractitionerGuidancePage from '../pages/practitionerGuidancePage'

context('Practitioner guidance', () => {
  it('shows the practitioner guidance index page', () => {
    cy.visit('/practitioner-guidance')
    Page.verifyOnPage(PractitionerGuidancePage)
  })

  it('lists every section with the current page shown as plain text', () => {
    cy.visit('/practitioner-guidance')
    cy.get('.es-contents-list__item').should('have.length', 14)
    cy.get('.es-contents-list__current').should('contain.text', 'About online check ins and what you need to do')
    cy.get('.es-contents-list a').should('have.length', 13)
  })

  it('navigates between sections using next and previous links', () => {
    cy.visit('/practitioner-guidance')
    cy.get('.govuk-pagination__prev').should('not.exist')
    cy.get('.govuk-pagination__next a').click()
    cy.location('pathname').should('eq', '/practitioner-guidance/how-you-can-use-online-check-ins')
    cy.get('h1').should('contain.text', 'How you can use online check ins')
    cy.get('.govuk-pagination__prev a').click()
    cy.location('pathname').should('eq', '/practitioner-guidance')
  })

  it('shows the not found page for an unknown section', () => {
    cy.request({ url: '/practitioner-guidance/not-a-real-page', failOnStatusCode: false })
      .its('status')
      .should('eq', 404)
  })
})
