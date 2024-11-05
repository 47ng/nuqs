/// <reference types="cypress" />

it('Reproduction for issue #388', () => {
  cy.config('retries', 0)
  cy.visit('/app/repro-388')
  cy.contains('#hydration-marker', 'hydrated').should('be.hidden')

  cy.get('#start').click()
  // The URL should have a ?counter=1 query string
  cy.location('search').should('eq', '?counter=1')
  // The counter should be rendered as 1 on the page
  cy.get('#counter').should('have.text', 'Counter: 1')
  // Hover the "Hover me" link
  cy.get('#hover-me').trigger('mouseover')
  cy.wait(100)
  // The URL should have a ?counter=1 query string
  cy.location('search').should('eq', '?counter=1')
  // The counter should be rendered as 1 on the page
  cy.get('#counter').should('have.text', 'Counter: 1')

  // Reset the page
  cy.visit('/app/repro-388')
  cy.get('#start').click()
  // The URL should have a ?counter=1 query string
  cy.location('search').should('eq', '?counter=1')
  // The counter should be rendered as 1 on the page
  cy.get('#counter').should('have.text', 'Counter: 1')
  // Mount the other link
  cy.get('#toggle').click()
  cy.wait(100)
  // The URL should have a ?counter=1 query string
  cy.location('search').should('eq', '?counter=1')
  // The counter should be rendered as 1 on the page
  cy.get('#counter').should('have.text', 'Counter: 1')
})
