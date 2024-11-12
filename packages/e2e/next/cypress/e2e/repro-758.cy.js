/// <reference types="cypress" />

describe('repro-758', () => {
  it('honors urlKeys when navigating back after a push', () => {
    cy.visit('/app/repro-758')
    cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
    cy.get('button').click()
    cy.get('#state').should('have.text', 'test')
    cy.go('back')
    cy.get('#state').should('be.empty')
  })
})
