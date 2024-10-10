/// <reference types="cypress" />

if (
  ['14.1.0', '14.1.1'].includes(Cypress.env('nextJsVersion')) === false // See issue #498
) {
  it('Reproduction for issue #498', () => {
    cy.config('retries', 0)
    cy.visit('/app/repro-498')
    cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
    cy.get('#start').click()
    cy.location('hash').should('eq', '#section')
    cy.get('button').click()
    cy.location('search').should('eq', '?q=test')
    cy.location('hash').should('eq', '#section')
  })
}
