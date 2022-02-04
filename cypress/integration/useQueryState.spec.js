/// <reference types="cypress" />

function runTest() {
  cy.get('#value').should('be.empty')
  cy.contains('Set A').click()
  cy.location('search').should('eq', '?key=a')
  cy.get('#value').should('have.text', 'a')
  cy.contains('Set B').click()
  cy.location('search').should('eq', '?key=b')
  cy.get('#value').should('have.text', 'b')
  cy.contains('Clear').click()
  cy.location('search').should('be.empty')
  cy.get('#value').should('be.empty')
}

describe('useQueryState', () => {
  it('uses string by default', () => {
    cy.visit('/useQueryState')
    runTest()
  })

  it('works in dynamic routes', () => {
    cy.visit('/useQueryState/dynamic/route')
    runTest()
  })
})
