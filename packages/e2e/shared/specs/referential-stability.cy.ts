import { createTest } from '../create-test'

export const testReferentialStability = createTest(
  'Referential stability',
  ({ path }) => {
    it('keeps referential stability of the setter function across updates', () => {
      cy.visit(path)
      cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
      cy.get('#state').should('have.text', 'pass')
      cy.get('button').click()
      cy.get('#state').should('have.text', 'pass')
    })
  }
)
