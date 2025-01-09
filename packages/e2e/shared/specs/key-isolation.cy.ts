import { createTest } from '../create-test'
import { assertLogCount, stubConsoleLog } from '../cypress/support/log-spy'

export const testKeyIsolation = createTest('Key isolation', ({ path }) => {
  it('does not render b when updating a', () => {
    cy.visit(path, stubConsoleLog)
    cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
    cy.get('#trigger-a').click()
    cy.get('#state-a').should('have.text', 'pass')
    cy.location('search').should('eq', '?a=pass')
    assertLogCount('render a', 3) // 1 at mount + 2 at update
    assertLogCount('render b', 1) // only 1 at mount
  })
  it('does not render a when updating b', () => {
    cy.visit(path, stubConsoleLog)
    cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
    cy.get('#trigger-b').click()
    cy.get('#state-b').should('have.text', 'pass')
    cy.location('search').should('eq', '?b=pass')
    assertLogCount('render b', 3) // 1 at mount + 2 at update
    assertLogCount('render a', 1) // only 1 at mount
  })
  it('does not render a again when updating b after a', () => {
    cy.visit(path, stubConsoleLog)
    cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
    cy.get('#trigger-a').click()
    cy.get('#state-a').should('have.text', 'pass')
    cy.get('#trigger-b').click()
    cy.get('#state-b').should('have.text', 'pass')
    cy.location('search').should('eq', '?a=pass&b=pass')
    assertLogCount('render a', 3) // 1 at mount + 2 at update
    assertLogCount('render b', 3) // 1 at mount + 2 at update
  })
})
