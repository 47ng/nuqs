/// <reference types="cypress" />

it('Clears the URL when setting the default value when `clearOnDefault` is used', () => {
  cy.visit('/app/clearOnDefault?a=a&b=b')
  cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
  cy.get('button').click()
  cy.location('search').should('eq', '?a=')
})
