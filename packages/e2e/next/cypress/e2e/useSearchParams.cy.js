/// <reference types="cypress" />

it('useSearchParams', () => {
  cy.visit('/app/useSearchParams')
  cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
  cy.get('input').type('foo', { delay: 0 })
  cy.get('#searchParams').should('have.text', 'q=foo')
  cy.get('button').click()
  cy.get('#searchParams').should('have.text', 'q=foo&push=true')
})
