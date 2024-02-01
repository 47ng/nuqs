/// <reference types="cypress" />

// if (Cypress.env('supportsShallowRouting')) {
it('useSearchParams', () => {
  cy.visit('/app/useSearchParams')
  cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
  cy.get('input').type('foo')
  cy.get('#searchParams').should('have.text', 'q=foo')
})
// }
