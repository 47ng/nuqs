import { createTest } from '../create-test'

export const testHashPreservation = createTest(
  'Hash Preservation',
  ({ path }) => {
    it('preserves the hash on state updates', () => {
      cy.visit(path + '#hash')
      cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
      cy.get('#set').click()
      cy.location('hash').should('eq', '#hash')
      cy.get('#clear').click()
      cy.location('hash').should('eq', '#hash')
    })
  }
)
