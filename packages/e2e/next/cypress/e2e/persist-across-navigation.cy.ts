import { expectPathname } from 'e2e-shared/lib/assertions'

it('Persists search params across navigation using a generated Link href', () => {
  cy.visit('/app/persist-across-navigation/a')
  cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
  cy.get('input[type=text]').type('foo', { delay: 0 })
  cy.get('input[type=checkbox]').check()
  cy.get('a').click()
  expectPathname('/app/persist-across-navigation/b')
  cy.location('search').should('eq', '?q=foo&checked=true')
  cy.get('input[type=text]').should('have.value', 'foo')
  cy.get('input[type=checkbox]').should('be.checked')
})
