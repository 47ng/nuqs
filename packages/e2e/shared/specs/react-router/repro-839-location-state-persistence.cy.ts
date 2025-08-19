import { createTest } from '../../create-test'

export const testRepro839LocationStatePersistence = createTest(
  'Repro for issue #839 - Location state persistence',
  ({ path }) => {
    it('persists location.state on shallow URL updates', () => {
      cy.visit(path)
      cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
      cy.get('#setup').click()
      cy.get('#shallow').click()
      cy.get('#state').should('have.text', '{"test":"pass"}')
    })

    it('persists location.state on deep URL updates', () => {
      cy.visit(path)
      cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
      cy.get('#setup').click()
      cy.get('#deep').click()
      cy.get('#state').should('have.text', '{"test":"pass"}')
    })
  }
)
