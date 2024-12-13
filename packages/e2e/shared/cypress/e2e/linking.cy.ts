import { describeLabel, TestConfig } from '../test-config'

export function testLinking({ path, ...config }: TestConfig) {
  describe(describeLabel('Linking', { path, ...config }), () => {
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
      cy.location('pathname').should('eq', path)
      cy.get('#state').should('have.text', 'pass')
    })
  })
}
