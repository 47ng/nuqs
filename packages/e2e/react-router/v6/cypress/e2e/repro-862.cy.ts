/// <reference types="cypress" />

import { createTest } from 'e2e-shared/create-test'

const testRepro862RouteComponentReuse = createTest(
  'Repro for issue #862 - Route component reuse',
  ({ path }) => {
    it('clears state when navigating to another route with the same component but no search params', () => {
      cy.visit(path)
      cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
      cy.get('#setup').click()
      cy.get('#navigate-clear').click()
      cy.get('#state').should('be.empty')
      cy.location('search').should('be.empty')
    })

    it('persists state when navigating to another route with the search params in the target navigation', () => {
      cy.visit(path)
      cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
      cy.get('#setup').click()
      cy.get('#navigate-persist').click()
      cy.get('#state').should('have.text', 'pass')
      cy.location('search').should('eq', '?test=pass')
    })
  }
)

testRepro862RouteComponentReuse({
  path: '/repro-862/useQueryState',
  hook: 'useQueryState'
})

testRepro862RouteComponentReuse({
  path: '/repro-862/useQueryStates',
  hook: 'useQueryStates'
})
