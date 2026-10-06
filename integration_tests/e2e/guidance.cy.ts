import Page from '../pages/page'
import GuidancePage from '../pages/guidancePage'

context('Guidance', () => {
  it('shows the guidance index page', () => {
    cy.visit('/guidance')
    Page.verifyOnPage(GuidancePage)
    cy.get('h2').contains('About the Check in with your probation officer service')
  })

  it('navigates between guidance pages using the contents list', () => {
    cy.visit('/guidance')
    cy.get('.es-contents-list').contains('a', 'Using online check ins').click()
    cy.location('pathname').should('eq', '/guidance/using-online-check-ins')
    Page.verifyOnPage(GuidancePage)
    cy.get('h2').contains('Using online check ins')
  })
})
