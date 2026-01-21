import Page from '../pages/page'
import PractitionerGuidancePage from '../pages/practitionerGuidancePage'

context('Practitioner guidance', () => {
  it('shows the practitioner guidance page', () => {
    cy.visit('/practitioner-guidance')
    Page.verifyOnPage(PractitionerGuidancePage)
  })
})
