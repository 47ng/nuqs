import { createTest } from '../create-test'

export const testPush = createTest('Push', ({ path }) => {
  it('pushes a new state to the history and allows navigating states with Back/Forward', () => {
    cy.visit(path + '?test=init')
    cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
    cy.get('button').click()
    cy.location('search').should('eq', '?test=pass')
    cy.get('#state').should('have.text', 'pass')
    cy.go('back')
    cy.get('#state').should('have.text', 'init')
    cy.location('search').should('eq', '?test=init')
    cy.go('forward')
    cy.location('search').should('eq', '?test=pass')
    cy.get('#state').should('have.text', 'pass')
  })
})
