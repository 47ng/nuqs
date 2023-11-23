/// <reference types="cypress" />

it('transitions', () => {
  cy.visit('/app/transitions')
  cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
  cy.get('#server-rendered').should('have.text', '{}')
  cy.get('#server-status').should('have.text', 'idle')
  const button = cy.get('button')
  button.should('have.text', '0')
  button.click()
  button.should('have.text', '1') // Instant setState
  cy.get('#server-rendered').should('have.text', '{}')
  cy.get('#server-status').should('have.text', 'loading')
  cy.wait(500)
  cy.get('#server-rendered').should('have.text', '{}')
  cy.get('#server-status').should('have.text', 'loading')
  cy.wait(500)
  cy.get('#server-rendered').should('have.text', '{"counter":"1"}')
  cy.get('#server-status').should('have.text', 'idle')
})
