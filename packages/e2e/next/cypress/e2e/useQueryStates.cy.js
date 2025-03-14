/// <reference types="cypress" />

function runTest() {
  cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
  cy.get('#json').should(
    'have.text',
    '{"string":null,"int":null,"float":null,"index":null,"bool":null}'
  )
  cy.get('#string').should('be.empty')
  cy.get('#int').should('be.empty')
  cy.get('#float').should('be.empty')
  cy.get('#index').should('be.empty')
  cy.get('#bool').should('be.empty')
  cy.location('search').should('be.empty')

  cy.contains('Set string').click()
  cy.location('search').should('eq', '?string=Hello')
  cy.get('#string').should('have.text', 'Hello')
  cy.get('#json').should(
    'have.text',
    '{"string":"Hello","int":null,"float":null,"index":null,"bool":null}'
  )

  cy.contains('Set int').click()
  cy.location('search').should('include', 'int=42')
  cy.get('#int').should('have.text', '42')
  cy.get('#json').should(
    'have.text',
    '{"string":"Hello","int":42,"float":null,"index":null,"bool":null}'
  )

  cy.contains('Set float').click()
  cy.location('search').should('include', 'float=3.14159')
  cy.get('#float').should('have.text', '3.14159')
  cy.get('#json').should(
    'have.text',
    '{"string":"Hello","int":42,"float":3.14159,"index":null,"bool":null}'
  )

  cy.contains('Set index').click()
  cy.location('search').should('include', 'index=9')
  cy.get('#index').should('have.text', '8')
  cy.get('#json').should(
    'have.text',
    '{"string":"Hello","int":42,"float":3.14159,"index":8,"bool":null}'
  )

  cy.contains('Toggle bool').click()
  cy.location('search').should('include', 'bool=true')
  cy.get('#bool').should('have.text', 'true')
  cy.get('#json').should(
    'have.text',
    '{"string":"Hello","int":42,"float":3.14159,"index":8,"bool":true}'
  )
  cy.contains('Toggle bool').click()
  cy.location('search').should('include', 'bool=false')
  cy.get('#bool').should('have.text', 'false')
  cy.get('#json').should(
    'have.text',
    '{"string":"Hello","int":42,"float":3.14159,"index":8,"bool":false}'
  )

  cy.get('#clear-string').click()
  cy.location('search').should('not.include', 'string=Hello')
  cy.get('#string').should('be.empty')
  cy.get('#json').should(
    'have.text',
    '{"string":null,"int":42,"float":3.14159,"index":8,"bool":false}'
  )

  cy.get('#clear').click()
  cy.location('search').should('not.include', 'string')
  cy.location('search').should('not.include', 'int')
  cy.location('search').should('not.include', 'float')
  cy.location('search').should('not.include', 'index')
  cy.location('search').should('not.include', 'bool')
  cy.get('#json').should(
    'have.text',
    '{"string":null,"int":null,"float":null,"index":null,"bool":null}'
  )
  cy.get('#string').should('be.empty')
  cy.get('#int').should('be.empty')
  cy.get('#float').should('be.empty')
  cy.get('#index').should('be.empty')
  cy.get('#bool').should('be.empty')
  cy.location('search').should('be.empty')
}

describe('useQueryStates (app router)', () => {
  it('uses string by default', () => {
    cy.visit('/app/useQueryStates')
    runTest()
  })

  it('should work with dynamic routes', () => {
    cy.visit('/app/useQueryStates/dynamic/route')
    runTest()
  })
})

describe('useQueryStates (pages router)', () => {
  it('uses string by default', () => {
    cy.visit('/pages/useQueryStates')
    runTest()
  })

  it('should work with dynamic routes', () => {
    cy.visit('/pages/useQueryStates/dynamic/route')
    runTest()
  })
})
