export function hashPreservation(url: string) {
  cy.visit(url + '#hash')
  cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
  cy.get('#set').click()
  cy.location('hash').should('eq', '#hash')
  cy.get('#clear').click()
  cy.location('hash').should('eq', '#hash')
}
