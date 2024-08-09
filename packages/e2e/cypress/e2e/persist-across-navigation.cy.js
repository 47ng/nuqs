/// <reference types="cypress" />

it('Persists search params across navigation using a generated Link href', () => {
  cy.visit('/app/persist-across-navigation/a')
  cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
  cy.get('input[type=text]').type('foo')
  cy.get('input[type=checkbox]').check()
  cy.get('a').click()
  cy.location('pathname').should('eq', '/app/persist-across-navigation/b')
  cy.location('search').should('eq', '?q=foo&checked=true')
  cy.get('input[type=text]').should('have.value', 'foo')
  cy.get('input[type=checkbox]').should('be.checked')
})
