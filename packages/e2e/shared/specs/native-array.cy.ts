import { createTest } from '../create-test'

export const testNativeArray = createTest('parseAsNativeArray', ({ path }) => {
  it('reads native array from the URL', () => {
    cy.visit(path + '?test=1&test=2&test=3')
    cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
    cy.get('#client-name').should('have.text', '1 - 2 - 3')
    cy.get('#add-button').click()
    cy.get('#client-name').should('have.text', '1 - 2 - 3 - 4')
  })
  it('writes native array to the URL', () => {
    cy.visit(path)
    cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
    cy.get('#client-name').should('be.empty')
    cy.get('#add-button').click()
    cy.location('search').should('eq', '?test=1')
    cy.get('#add-button').click()
    cy.location('search').should('eq', '?test=1&test=2')
  })
  it('works with the browser back button', () => {
    cy.visit(path)
    cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
    cy.get('#client-name').should('be.empty')
    cy.get('#add-button').click()
    cy.get('#add-button').click()
    cy.get('#add-button').click()
    cy.location('search').should('eq', '?test=1&test=2&test=3')
    cy.get('#client-name').should('have.text', '1 - 2 - 3')
    cy.go('back')
    cy.location('search').should('eq', '?test=1&test=2')
    cy.get('#client-name').should('have.text', '1 - 2')
  })
})
