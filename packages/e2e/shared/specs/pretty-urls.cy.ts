import { createTest } from '../create-test'

export const testPrettyUrls = createTest('Pretty URLs', ({ path }) => {
  it('should render unencoded characters', () => {
    cy.visit(path)
    cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
    cy.get('button').click()
    cy.get('#state').should('have.text', '-._~!$()*,;=:@/?[]{}\\|^')
  })
})
