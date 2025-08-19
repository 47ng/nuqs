import { createTest } from '../../create-test'

export const testFogOfWar = createTest('Fog of War', ({ path }) => {
  it('should navigate to the result page', () => {
    cy.visit(path)
    cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
    cy.get('#set').click()
    cy.get('#navigate').click()
    cy.location('pathname').should('eq', `${path}/result`)
    cy.get('#result').should('have.text', 'pass')
  })
})
