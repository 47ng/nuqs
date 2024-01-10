/// <reference types="cypress" />

function runTest() {
  cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
  cy.get('#string_set_a').click()
  cy.location('search').should('eq', '?string=a')
  cy.location('hash').should('eq', '#hash')
  cy.get('#string_set_b').click()
  cy.location('search').should('eq', '?string=b')
  cy.location('hash').should('eq', '#hash')
  cy.get('#string_clear').click()
  cy.location('hash').should('eq', '#hash')
}

describe('hash preservation (app router)', () => {
  it('works in standard routes', () => {
    cy.visit('/app/useQueryState#hash')
    runTest()
  })

  it('works in dynamic routes', () => {
    cy.visit('/app/useQueryState/dynamic/route#hash')
    runTest()
  })
})

describe('hash preservation (pages router)', () => {
  it('works in standard routes', () => {
    cy.visit('/pages/useQueryState#hash')
    runTest()
  })

  it('works in dynamic routes', () => {
    cy.visit('/pages/useQueryState/dynamic/route#hash')
    runTest()
  })
})
