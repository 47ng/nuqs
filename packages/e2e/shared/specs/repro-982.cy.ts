import { createTest } from '../create-test'

export const testRepro982 = createTest('repro-982', ({ path }) => {
  it('keeps the first search param after an update when multiple ones occur', () => {
    cy.visit(`${path}?test=pass&test=fail`)
    cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
    cy.get('#client-state').should('have.text', 'pass')
    cy.get('button').click()
    cy.location('search').should('eq', '?test=pass&test=fail&other=x')
    cy.get('#client-state').should('have.text', 'pass')
  })
})
