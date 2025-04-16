describe('repro-982', () => {
  it('keeps the first search param after an update when multiple ones occur', () => {
    cy.visit('/pages/repro-982?test=pass&test=fail')
    cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
    cy.get('#client-state').should('have.text', 'pass')
    cy.get('button').click()
    cy.location('search').should('eq', '?test=pass&test=fail&other=x')
    cy.get('#client-state').should('have.text', 'pass')
  })
})
