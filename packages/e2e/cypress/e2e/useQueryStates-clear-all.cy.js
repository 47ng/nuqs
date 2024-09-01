/// <reference types="cypress" />

it('useQueryStates clear all', () => {
  cy.visit('/app/useQueryStates-clear-all?a=foo&b=bar')
  cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
  cy.get('button').click()
  cy.location('search').should('eq', '')
})
