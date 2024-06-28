/// <reference types="cypress" />

describe('internals', () => {
  it('works in app router', () => {
    cy.visit('/app/internals')
    cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
    cy.get('#nextJsVersion').should('have.text', Cypress.env('nextJsVersion'))
  })
})
