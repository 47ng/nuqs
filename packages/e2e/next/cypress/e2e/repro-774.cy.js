/// <reference types="cypress" />

describe('repro-774', () => {
  it('updates internal state on navigation', () => {
    cy.visit('/app/repro-774')
    cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
    cy.get('#trigger-a').click()
    cy.get('#value-a').should('have.text', 'a')
    cy.get('#value-b').should('be.empty')
    cy.get('#link').click()
    cy.get('#value-a').should('be.empty')
    cy.get('#value-b').should('be.empty')
    cy.get('#trigger-b').click()
    cy.get('#value-a').should('be.empty')
    cy.get('#value-b').should('have.text', 'b')
  })
})
