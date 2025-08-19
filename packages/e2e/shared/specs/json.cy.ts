import { createTest } from '../create-test'

export const testJson = createTest('parseAsJson', ({ path }) => {
  it('reads JSON from the URL', () => {
    cy.visit(path + '?test={"name":"pass","age":123}')
    cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
    cy.get('#name-input').should('have.value', 'pass')
    cy.get('#client-name').should('have.text', 'pass')
    cy.get('#client-age').should('have.text', '123')
  })
  it('writes JSON to the URL', () => {
    cy.visit(path)
    cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
    cy.get('#name-input').should('have.value', 'init')
    cy.get('#client-name').should('have.text', 'init')
    cy.get('#client-age').should('have.text', '42')
    cy.get('button').click()
    cy.location('search').should(
      'eq',
      '?test={%22name%22:%22pass%22,%22age%22:43}'
    )
    cy.get('#name-input').should('have.value', 'pass')
    cy.get('#client-name').should('have.text', 'pass')
    cy.get('#client-age').should('have.text', '43')
  })
})
