/// <reference types="cypress" />

describe('cache', () => {
  it('works in app router', () => {
    cy.visit('/app/cache?str=foo&num=42&bool=true')
    cy.get('#parse-str').should('have.text', 'foo')
    cy.get('#parse-num').should('have.text', '42')
    cy.get('#parse-bool').should('have.text', 'true')
    cy.get('#parse-def').should('have.text', 'default')
    cy.get('#parse-nope').should('have.text', 'null')
    cy.get('#all-str').should('have.text', 'foo')
    cy.get('#all-num').should('have.text', '42')
    cy.get('#all-bool').should('have.text', 'true')
    cy.get('#all-def').should('have.text', 'default')
    cy.get('#all-nope').should('have.text', 'null')
    cy.get('#get-str').should('have.text', 'foo')
    cy.get('#get-num').should('have.text', '42')
    cy.get('#get-bool').should('have.text', 'true')
    cy.get('#get-def').should('have.text', 'default')
    cy.get('#get-nope').should('have.text', 'null')
  })
})
