export function expectPathname(pathname: string) {
  const basePath = Cypress.env('basePath')
  const expected = basePath === undefined ? pathname : basePath + pathname
  cy.location('pathname').should('eq', expected)
}
