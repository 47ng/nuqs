/// <reference types="cypress" />

it('Clears the URL when setting the default value when `clearOnDefault` is used', () => {
  cy.visit(
    '/app/clearOnDefault?a=a&b=b&array=1,2,3&json-ref={"egg":"spam"}&json-new={"egg":"spam"}'
  )
  cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
  cy.get('button').click()
  cy.location('search').should('eq', '?a=')
})
