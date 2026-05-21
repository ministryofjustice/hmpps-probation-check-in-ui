context('Language toggle', () => {
  beforeEach(() => {
    cy.clearCookie('lang')
  })

  it('shows both language links on a public page, with English marked active by default', () => {
    cy.visit('/accessibility')

    cy.get('html').should('have.attr', 'lang', 'en')

    cy.get('.hmpps-language-toggle__item').should('have.length', 2)
    cy.get('.hmpps-language-toggle__item--active').should('contain.text', 'English')
    cy.get('.hmpps-language-toggle a').contains('Cymraeg').should('have.attr', 'href').and('include', 'lang=cy')
  })

  it('sets the lang cookie and switches html lang when the Cymraeg link is followed', () => {
    cy.visit('/accessibility')
    cy.get('.hmpps-language-toggle a').contains('Cymraeg').click()

    cy.location('pathname').should('eq', '/accessibility')
    cy.location('search').should('not.contain', 'lang=')
    cy.getCookie('lang').should('have.property', 'value', 'cy')
    cy.get('html').should('have.attr', 'lang', 'cy')

    cy.get('.hmpps-language-toggle__item--active').should('contain.text', 'Cymraeg')
    cy.get('.hmpps-language-toggle a').contains('English').should('have.attr', 'href').and('include', 'lang=en')
  })

  it('persists the language preference across page loads via the cookie', () => {
    cy.setCookie('lang', 'cy')
    cy.visit('/privacy-notice')
    cy.get('html').should('have.attr', 'lang', 'cy')

    cy.visit('/accessibility')
    cy.get('html').should('have.attr', 'lang', 'cy')
  })

  it('switches back to English when the English link is followed', () => {
    cy.setCookie('lang', 'cy')
    cy.visit('/accessibility')
    cy.get('.hmpps-language-toggle a').contains('English').click()

    cy.getCookie('lang').should('have.property', 'value', 'en')
    cy.get('html').should('have.attr', 'lang', 'en')
  })
})
