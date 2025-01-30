import { createTest } from '../create-test'

export const testConditionalRendering = createTest(
  'Conditional rendering',
  ({ path }) => {
    it('should have the correct initial state after mounting', () => {
      cy.visit(path + '?test=pass')
      cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
      cy.get('button#mount').click()
      cy.get('#state').should('have.text', 'pass')
    })
    it('should keep the correct state after unmounting and remounting', () => {
      cy.visit(path)
      cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
      cy.get('button#mount').click()
      cy.get('button#set').click()
      cy.get('button#unmount').click()
      cy.get('button#mount').click()
      cy.get('#state').should('have.text', 'pass')
    })
  }
)
