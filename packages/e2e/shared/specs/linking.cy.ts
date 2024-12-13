import { createTest } from '../create-test'

export const testLinking = createTest('Linking', ({ path }) => {
  it('picks up state from Links pointing to the same page', () => {
    cy.visit(path)
    cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
    cy.get('#state').should('be.empty')
    cy.get('a').click()
    cy.get('#state').should('have.text', 'pass')
  })

  it('picks up state from Links pointing to the same page', () => {
    cy.visit(path + '/other')
    cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
    cy.get('#state').should('be.empty')
    cy.get('a').click()
    cy.get('#state').should('have.text', 'pass')
  })
})
