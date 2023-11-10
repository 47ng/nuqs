/// <reference types="cypress" />

describe('internals', () => {
  it('works in app router', () => {
    cy.visit('/app/internals')
    cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
    cy.get('#__N').should('have.text', 'undefined')
    cy.get('#__NA').should('have.text', 'true')
    cy.get('#basePath').should('have.text', Cypress.env('basePath'))
  })

  it('works in pages router', () => {
    cy.visit('/pages/internals')
    cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
    cy.get('#__N').should('have.text', 'true')
    cy.get('#__NA').should('have.text', 'undefined')
    cy.get('#basePath').should('have.text', Cypress.env('basePath'))
  })
})
