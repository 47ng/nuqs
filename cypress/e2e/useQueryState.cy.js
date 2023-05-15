/// <reference types="cypress" />

function runTest() {
  // String
  {
    cy.get('#string_value').should('be.empty')
    cy.get('#string_set_a')
      .click()
      .location('search')
      .should('eq', '?string=a')
      .get('#string_value')
      .should('have.text', 'a')
    cy.get('#string_set_b')
      .click()
      .location('search')
      .should('eq', '?string=b')
      .get('#string_value')
      .should('have.text', 'b')
    cy.get('#string_clear')
      .click()
      .location('search')
      .should('be.empty')
      .get('#string_value')
      .should('be.empty')
  }

  // Integer
  {
    cy.get('#int_value').should('be.empty')
    cy.get('#int_increment')
      .click()
      .location('search')
      .should('eq', '?int=1')
      .get('#int_value')
      .should('have.text', '1')
    cy.get('#int_increment')
      .click()
      .location('search')
      .should('eq', '?int=2')
      .get('#int_value')
      .should('have.text', '2')
    cy.get('#int_decrement')
      .click()
      .location('search')
      .should('eq', '?int=1')
      .get('#int_value')
      .should('have.text', '1')
    cy.get('#int_decrement')
      .click()
      .location('search')
      .should('eq', '?int=0')
      .get('#int_value')
      .should('have.text', '0')
    cy.get('#int_decrement')
      .click()
      .location('search')
      .should('eq', '?int=-1')
      .get('#int_value')
      .should('have.text', '-1')
    cy.get('#int_clear')
      .click()
      .location('search')
      .should('be.empty')
      .get('#int_value')
      .should('be.empty')
  }

  // Float
  {
    cy.get('#float_value').should('be.empty')
    cy.get('#float_increment')
      .click()
      .location('search')
      .should('eq', '?float=0.1')
      .get('#float_value')
      .should('have.text', '0.1')
    cy.get('#float_increment')
      .click()
      .location('search')
      .should('eq', '?float=0.2')
      .get('#float_value')
      .should('have.text', '0.2')
    cy.get('#float_decrement')
      .click()
      .location('search')
      .should('eq', '?float=0.1')
      .get('#float_value')
      .should('have.text', '0.1')
    cy.get('#float_decrement')
      .click()
      .location('search')
      .should('eq', '?float=0')
      .get('#float_value')
      .should('have.text', '0')
    cy.get('#float_decrement')
      .click()
      .location('search')
      .should('eq', '?float=-0.1')
      .get('#float_value')
      .should('have.text', '-0.1')
    cy.get('#float_clear')
      .click()
      .location('search')
      .should('be.empty')
      .get('#float_value')
      .should('be.empty')
  }

  // Float
  {
    cy.get('#bool_value').should('be.empty')
    cy.get('#bool_toggle')
      .click()
      .location('search')
      .should('eq', '?bool=true')
      .get('#bool_value')
      .should('have.text', 'true')
    cy.get('#bool_toggle')
      .click()
      .location('search')
      .should('eq', '?bool=false')
      .get('#bool_value')
      .should('have.text', 'false')
    cy.get('#bool_clear')
      .click()
      .location('search')
      .should('be.empty')
      .get('#bool_value')
      .should('be.empty')
  }

  // todo: Add tests for:
  // Timestamp
  // ISO DateTime
  // String enum
  // JSON object
  // Array of strings
  // Array of integers
}

describe('useQueryState', () => {
  it('works in standard routes', () => {
    cy.visit('/useQueryState')
    runTest()
  })

  it('works in dynamic routes', () => {
    cy.visit('/useQueryState/dynamic/route')
    runTest()
  })
})
