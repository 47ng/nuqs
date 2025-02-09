/// <reference types="cypress" />

function runTest(pathname) {
  cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
  // String
  {
    cy.get('#string_value').should('be.empty')
    cy.get('#string_set_a').click()
    cy.location('pathname').should('eq', pathname)
    cy.location('search').should('eq', '?string=a')
    cy.get('#string_value').should('have.text', 'a')
    cy.get('#string_set_b').click()
    cy.location('pathname').should('eq', pathname)
    cy.location('search').should('eq', '?string=b')
    cy.get('#string_value').should('have.text', 'b')
    cy.get('#string_clear').click()
    cy.location('pathname').should('eq', pathname)
    cy.location('search').should('be.empty')
    cy.get('#string_value').should('be.empty')
  }

  // Integer
  {
    cy.get('#int_value').should('be.empty')
    cy.get('#int_increment').click()
    cy.location('search').should('eq', '?int=1')
    cy.get('#int_value').should('have.text', '1')
    cy.get('#int_increment').click()
    cy.location('search').should('eq', '?int=2')
    cy.get('#int_value').should('have.text', '2')
    cy.get('#int_decrement').click()
    cy.location('search').should('eq', '?int=1')
    cy.get('#int_value').should('have.text', '1')
    cy.get('#int_decrement').click()
    cy.location('search').should('eq', '?int=0')
    cy.get('#int_value').should('have.text', '0')
    cy.get('#int_decrement').click()
    cy.location('search').should('eq', '?int=-1')
    cy.get('#int_value').should('have.text', '-1')
    cy.get('#int_clear').click()
    cy.location('search').should('be.empty')
    cy.get('#int_value').should('be.empty')
  }

  // Float
  {
    cy.get('#float_value').should('be.empty')
    cy.get('#float_increment').click()
    cy.location('search').should('eq', '?float=0.1')
    cy.get('#float_value').should('have.text', '0.1')
    cy.get('#float_increment').click()
    cy.location('search').should('eq', '?float=0.2')
    cy.get('#float_value').should('have.text', '0.2')
    cy.get('#float_decrement').click()
    cy.location('search').should('eq', '?float=0.1')
    cy.get('#float_value').should('have.text', '0.1')
    cy.get('#float_decrement').click()
    cy.location('search').should('eq', '?float=0')
    cy.get('#float_value').should('have.text', '0')
    cy.get('#float_decrement').click()
    cy.location('search').should('eq', '?float=-0.1')
    cy.get('#float_value').should('have.text', '-0.1')
    cy.get('#float_clear').click()
    cy.location('search').should('be.empty')
    cy.get('#float_value').should('be.empty')
  }

  // Float
  {
    cy.get('#bool_value').should('be.empty')
    cy.get('#bool_toggle').click()
    cy.location('search').should('eq', '?bool=true')
    cy.get('#bool_value').should('have.text', 'true')
    cy.get('#bool_toggle').click()
    cy.location('search').should('eq', '?bool=false')
    cy.get('#bool_value').should('have.text', 'false')
    cy.get('#bool_clear').click()
    cy.location('search').should('be.empty')
    cy.get('#bool_value').should('be.empty')
  }

  // Index
  {
    cy.get('#index_value').should('be.empty')
    cy.get('#index_increment').click()
    cy.location('search').should('eq', '?index=2')
    cy.get('#index_value').should('have.text', '1')
    cy.get('#index_increment').click()
    cy.location('search').should('eq', '?index=3')
    cy.get('#index_value').should('have.text', '2')
    cy.get('#index_decrement').click()
    cy.location('search').should('eq', '?index=2')
    cy.get('#index_value').should('have.text', '1')
    cy.get('#index_decrement').click()
    cy.location('search').should('eq', '?index=1')
    cy.get('#index_value').should('have.text', '0')
    cy.get('#index_decrement').click()
    cy.get('#index_clear').click()
    cy.location('search').should('be.empty')
    cy.get('#index_value').should('be.empty')
  }

  // todo: Add tests for:
  // Timestamp
  // ISO DateTime
  // String enum
  // JSON object
  // Array of strings
  // Array of integers
}

describe('useQueryState (app router)', () => {
  it('works in standard routes', () => {
    cy.visit('/app/useQueryState')
    runTest(`${Cypress.env('basePath')}/app/useQueryState`)
  })

  it('works in dynamic routes', () => {
    cy.visit('/app/useQueryState/dynamic/route')
    runTest(`${Cypress.env('basePath')}/app/useQueryState/dynamic/route`)
  })
})

describe('useQueryState (pages router)', () => {
  it('works in standard routes', () => {
    cy.visit('/pages/useQueryState')
    runTest(`${Cypress.env('basePath')}/pages/useQueryState`)
  })

  it('works in dynamic routes', () => {
    cy.visit('/pages/useQueryState/dynamic/route')
    runTest(`${Cypress.env('basePath')}/pages/useQueryState/dynamic/route`)
  })
})
