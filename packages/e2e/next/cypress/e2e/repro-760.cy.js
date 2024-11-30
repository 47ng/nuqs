/// <reference types="cypress" />

describe('repro-760', () => {
  it('supports dynamic default values', () => {
    cy.visit('/app/repro-760')
    cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
    cy.get('#value-a').should('have.text', 'a')
    cy.get('#value-b').should('have.text', 'b')
    cy.get('#trigger-a').click()
    cy.get('#trigger-b').click()
    cy.get('#value-a').should('have.text', 'pass')
    cy.get('#value-b').should('have.text', 'pass')
  })
})
