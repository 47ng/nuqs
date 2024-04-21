/// <reference types="cypress" />

it('Reproduction for issue #542', () => {
  cy.visit('/app/repro-542/a?q=foo&r=bar')
  cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
  cy.get('#q').should('have.text', 'foo')
  cy.get('#r').should('have.text', 'bar')
  cy.get('a').click()
  cy.location('search').should('eq', '')
  cy.get('#q').should('have.text', '')
  cy.get('#r').should('have.text', '')
  cy.get('#initial').should('have.text', '{"q":null,"r":null}')
})
