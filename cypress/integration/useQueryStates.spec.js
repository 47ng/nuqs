/// <reference types="cypress" />

describe('useQueryStates', () => {
  it('uses string by default', () => {
    cy.visit('/useQueryStates')
    cy.get('#json').should(
      'have.text',
      '{"string":null,"int":null,"float":null,"bool":null}'
    )
    cy.get('#string').should('be.empty')
    cy.get('#int').should('be.empty')
    cy.get('#float').should('be.empty')
    cy.get('#bool').should('be.empty')

    cy.contains('Set string').click()
    cy.url().should('include', 'string=Hello')
    cy.get('#string').should('have.text', 'Hello')
    cy.get('#json').should(
      'have.text',
      '{"string":"Hello","int":null,"float":null,"bool":null}'
    )

    cy.contains('Set int').click()
    cy.url().should('include', 'int=42')
    cy.get('#int').should('have.text', '42')
    cy.get('#json').should(
      'have.text',
      '{"string":"Hello","int":42,"float":null,"bool":null}'
    )

    cy.contains('Set float').click()
    cy.url().should('include', 'float=3.14159')
    cy.get('#float').should('have.text', '3.14159')
    cy.get('#json').should(
      'have.text',
      '{"string":"Hello","int":42,"float":3.14159,"bool":null}'
    )

    cy.contains('Toggle bool').click()
    cy.url().should('include', 'bool=true')
    cy.get('#bool').should('have.text', 'true')
    cy.get('#json').should(
      'have.text',
      '{"string":"Hello","int":42,"float":3.14159,"bool":true}'
    )
    cy.contains('Toggle bool').click()
    cy.url().should('include', 'bool=false')
    cy.get('#bool').should('have.text', 'false')
    cy.get('#json').should(
      'have.text',
      '{"string":"Hello","int":42,"float":3.14159,"bool":false}'
    )

    cy.get('#clear-string').click()
    cy.url().should('not.include', 'string=Hello')
    cy.get('#string').should('be.empty')
    cy.get('#json').should(
      'have.text',
      '{"string":null,"int":42,"float":3.14159,"bool":false}'
    )

    cy.get('#clear').click()
    cy.url().should('not.include', 'string')
    cy.url().should('not.include', 'int')
    cy.url().should('not.include', 'float')
    cy.url().should('not.include', 'bool')
    cy.get('#json').should(
      'have.text',
      '{"string":null,"int":null,"float":null,"bool":null}'
    )
    cy.get('#string').should('be.empty')
    cy.get('#int').should('be.empty')
    cy.get('#float').should('be.empty')
    cy.get('#bool').should('be.empty')
  })
})
