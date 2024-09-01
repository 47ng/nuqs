/// <reference types="cypress" />

it('useQueryStates options', () => {
  cy.visit('/app/useQueryStates-options?a=foo&b=bar')
  cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
  cy.get('#1').click()
  cy.location('search').should('eq', '?b=')
  cy.visit('/app/useQueryStates-options?a=foo&b=bar')
  cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
  cy.get('#2').click()
  cy.location('search').should('eq', '?a=&b=')
  cy.visit('/app/useQueryStates-options?a=foo&b=bar')
  cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
  cy.get('#3').click()
  cy.location('search').should('eq', '')
})
