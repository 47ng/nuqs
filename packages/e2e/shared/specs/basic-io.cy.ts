import { createTest } from '../create-test'

export const testBasicIO = createTest('Basic I/O', ({ path }) => {
  it('reads the value from the URL on mount', () => {
    cy.visit(path + '?test=init')
    cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
    cy.get('#state').should('have.text', 'init')
  })

  it('writes the value to the URL', () => {
    cy.visit(path)
    cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
    cy.get('#state').should('be.empty')
    cy.get('button#set-pass').click()
    cy.get('#state').should('have.text', 'pass')
    cy.location('search').should('eq', '?test=pass')
  })

  it('updates the value in the URL', () => {
    cy.visit(path + '?test=init')
    cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
    cy.get('#state').should('have.text', 'init')
    cy.get('button#set-pass').click()
    cy.get('#state').should('have.text', 'pass')
    cy.location('search').should('eq', '?test=pass')
  })

  it('removes the value from the URL', () => {
    cy.visit(path + '?test=init')
    cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
    cy.get('button#clear').click()
    cy.get('#state').should('be.empty')
    cy.location('search').should('eq', '')
  })

  it('removes a set value from the URL', () => {
    cy.visit(path)
    cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
    cy.get('button#set-pass').click()
    cy.get('button#clear').click()
    cy.get('#state').should('be.empty')
    cy.location('search').should('eq', '')
  })
})
