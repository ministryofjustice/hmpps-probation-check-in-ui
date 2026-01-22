import Page from '../pages/page'
import GuidancePage from '../pages/guidancePage'

context('Guidance', () => {
  it('shows the guidance page', () => {
    cy.visit('/guidance')
    Page.verifyOnPage(GuidancePage)
  })
})
