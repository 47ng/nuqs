/// <reference types="cypress" />

it('Supports rewrites (server-side only)', () => {
  cy.visit('/app/rewrites/source?through=original')
  cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
  cy.get('#injected-server').should('have.text', 'by rewrites')
  cy.get('#injected-client').should('have.text', 'null')
  cy.get('#through-server').should('have.text', 'original')
  cy.get('#through-client').should('have.text', 'original')
})
