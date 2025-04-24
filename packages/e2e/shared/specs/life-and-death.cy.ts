import { createTest } from '../create-test'

/**
 * This tests that components mounting from a URL state update that also consume
 * that state do mount with the correct (optimistic) one from the get-go.
 * It also tests that they can clear it (self-destruct) and that they don't
 * throw errors when doing so.
 * See https://github.com/47ng/nuqs/issues/702
 */

export const testLifeAndDeath = createTest('Life & Death', ({ path }) => {
  function assertFilledState() {
    cy.get('#client-useQueryState').should('have.text', 'pass')
    cy.get('#client-useQueryStates').should('have.text', 'pass')
    cy.get('#null-detector-useQueryState').should('have.text', 'pass')
    cy.get('#null-detector-useQueryStates').should('have.text', 'pass')
  }
  function assertEmptyState() {
    cy.get('button').should('have.length', 2)
    cy.contains('#client-useQueryState').should('not.exist')
    cy.contains('#client-useQueryStates').should('not.exist')
    cy.contains('#null-detector-useQueryState').should('not.exist')
    cy.contains('#null-detector-useQueryStates').should('not.exist')
  }

  it('set from URL initial state, clear from useQueryState', () => {
    cy.visit(path + '?test=pass')
    cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
    assertFilledState()
    cy.get('#clear-useQueryState').click()
    assertEmptyState()
  })
  it('set from URL initial state, clear from useQueryStates', () => {
    cy.visit(path + '?test=pass')
    cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
    assertFilledState()
    cy.get('#clear-useQueryStates').click()
    assertEmptyState()
  })

  it('set from useQueryState, clear from useQueryState', () => {
    cy.visit(path)
    cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
    cy.get('#set-useQueryState').click()
    assertFilledState()
    cy.get('#clear-useQueryState').click()
    assertEmptyState()
  })
  it('set from useQueryState, clear from useQueryStates', () => {
    cy.visit(path)
    cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
    cy.get('#set-useQueryState').click()
    assertFilledState()
    cy.get('#clear-useQueryStates').click()
    assertEmptyState()
  })
  it('set from useQueryStates, clear from useQueryState', () => {
    cy.visit(path)
    cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
    cy.get('#set-useQueryStates').click()
    assertFilledState()
    cy.get('#clear-useQueryState').click()
    assertEmptyState()
  })
  it('set from useQueryStates, clear from useQueryStates', () => {
    cy.visit(path)
    cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
    cy.get('#set-useQueryStates').click()
    assertFilledState()
    cy.get('#clear-useQueryStates').click()
    assertEmptyState()
  })
})
