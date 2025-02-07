import { createTest } from '../create-test'

export const testLoader = createTest('Loader', ({ path }) => {
  it('loads state from the URL', () => {
    cy.visit(path + '?test=pass&int=42')
    cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
    cy.get('#test').should('have.text', 'pass')
    cy.get('#int').should('have.text', '42')
  })
})
