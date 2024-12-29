import { createTest } from '../create-test'

export const testForm = createTest('Form', ({ path }) => {
  it('supports native HTML forms to update search params', () => {
    cy.visit(path)
    cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
    cy.get('input').type('pass')
    cy.get('form').submit()
    cy.get('#state').should('have.text', 'pass')
    cy.go('back')
    cy.get('#state').should('have.text', '')
  })

  it('supports loading initial form state from the URL', () => {
    cy.visit(path + '?test=init')
    cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
    cy.get('input').should('have.value', 'init')
    cy.get('#state').should('have.text', 'init')
    cy.get('input').clear().type('pass')
    cy.get('form').submit()
    cy.get('#state').should('have.text', 'pass')
    cy.go('back')
    cy.get('#state').should('have.text', 'init')
  })
})
