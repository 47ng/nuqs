import { createTest } from '../create-test'

export const testRepro702 = createTest('repro-702', ({ path }) => {
  it('mounts components with the correct state on load', () => {
    cy.visit(`${path}?a=test&b=test`)
    cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
    cy.get('#conditional-a-useQueryState').should('have.text', 'test pass')
    cy.get('#conditional-a-useQueryStates').should('have.text', 'test pass')
    cy.get('#conditional-b-useQueryState').should('have.text', 'test pass')
    cy.get('#conditional-b-useQueryStates').should('have.text', 'test pass')
  })

  it('mounts components with the correct state after an update', () => {
    cy.visit(path)
    cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
    cy.get('#trigger-a').click()
    cy.get('#conditional-a-useQueryState').should('have.text', 'test pass')
    cy.get('#conditional-a-useQueryStates').should('have.text', 'test pass')
    cy.get('#trigger-b').click()
    cy.get('#conditional-b-useQueryState').should('have.text', 'test pass')
    cy.get('#conditional-b-useQueryStates').should('have.text', 'test pass')
  })
})
