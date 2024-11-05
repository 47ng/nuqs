/// <reference types="cypress" />

describe('push', () => {
  it('works in app router', () => {
    cy.visit('/app/push')
    cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
    cy.get('#server-side').should('have.text', '0')
    cy.get('#server').should('have.text', '0')
    cy.get('#client').should('have.text', '0')

    cy.get('button#server-incr').click()
    cy.location('search').should('eq', '?server=1')
    cy.get('#server-side').should('have.text', '1')
    cy.get('#server').should('have.text', '1')
    cy.get('#client').should('have.text', '0')

    cy.get('button#client-incr').click()
    cy.location('search').should('eq', '?server=1&client=1')
    cy.get('#server-side').should('have.text', '1')
    cy.get('#server').should('have.text', '1')
    cy.get('#client').should('have.text', '1')

    cy.go('back')
    cy.location('search').should('eq', '?server=1')
    cy.get('#server-side').should('have.text', '1')
    cy.get('#server').should('have.text', '1')
    cy.get('#client').should('have.text', '0')

    cy.go('back')
    cy.location('search').should('be.empty')
    cy.get('#server-side').should('have.text', '0')
    cy.get('#server').should('have.text', '0')
    cy.get('#client').should('have.text', '0')

    cy.go('forward')
    cy.location('search').should('eq', '?server=1')
    cy.get('#server-side').should('have.text', '1')
    cy.get('#server').should('have.text', '1')
    cy.get('#client').should('have.text', '0')

    cy.go('forward')
    cy.location('search').should('eq', '?server=1&client=1')
    cy.get('#server-side').should('have.text', '1')
    cy.get('#server').should('have.text', '1')
    cy.get('#client').should('have.text', '1')
  })

  it('works in pages router', () => {
    cy.visit('/pages/push')
    cy.get('#server-side').should('have.text', '0')
    cy.get('#server').should('have.text', '0')
    cy.get('#client').should('have.text', '0')

    cy.get('button#server-incr').click()
    cy.location('search').should('eq', '?server=1')
    cy.get('#server-side').should('have.text', '1')
    cy.get('#server').should('have.text', '1')
    cy.get('#client').should('have.text', '0')

    cy.get('button#client-incr').click()
    cy.location('search').should('eq', '?server=1&client=1')
    cy.get('#server-side').should('have.text', '1')
    cy.get('#server').should('have.text', '1')
    cy.get('#client').should('have.text', '1')

    cy.go('back')
    cy.location('search').should('eq', '?server=1')
    cy.get('#server-side').should('have.text', '1')
    cy.get('#server').should('have.text', '1')
    cy.get('#client').should('have.text', '0')

    cy.go('back')
    cy.location('search').should('be.empty')
    cy.get('#server-side').should('have.text', '0')
    cy.get('#server').should('have.text', '0')
    cy.get('#client').should('have.text', '0')

    cy.go('forward')
    cy.location('search').should('eq', '?server=1')
    cy.get('#server-side').should('have.text', '1')
    cy.get('#server').should('have.text', '1')
    cy.get('#client').should('have.text', '0')

    cy.go('forward')
    cy.location('search').should('eq', '?server=1&client=1')
    cy.get('#server-side').should('have.text', '1')
    cy.get('#server').should('have.text', '1')
    cy.get('#client').should('have.text', '1')
  })
})
