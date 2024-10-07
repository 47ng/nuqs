/// <reference types="cypress" />

it('Remapped keys', () => {
  cy.visit('/app/remapped-keys')
  cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
  cy.get('#search').type('a')
  cy.get('#page').clear().type('42')
  cy.get('#react').check()
  cy.get('#nextjs').check()
  cy.location('search').should('eq', '?q=a&page=42&tags=react,next.js')
})
