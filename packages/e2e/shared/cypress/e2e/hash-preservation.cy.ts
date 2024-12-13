export function testHashPreservation(path: string) {
  cy.visit(path + '#hash')
  cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
  cy.get('#set').click()
  cy.location('hash').should('eq', '#hash')
  cy.get('#clear').click()
  cy.location('hash').should('eq', '#hash')
}
