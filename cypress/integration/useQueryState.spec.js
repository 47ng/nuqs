/// <reference types="cypress" />

describe('useQueryState', () => {
  it('uses string by default', () => {
    cy.visit('/useQueryState')
    cy.get('#value').should('be.empty')
    cy.contains('Set A').click()
    cy.url().should('include', '/useQueryState?key=a')
    cy.get('#value').should('have.text', 'a')
    cy.contains('Set B').click()
    cy.url().should('include', '/useQueryState?key=b')
    cy.get('#value').should('have.text', 'b')
    cy.contains('Clear').click()
    cy.url().should('include', '/useQueryState')
    cy.get('#value').should('be.empty')
  })
})
