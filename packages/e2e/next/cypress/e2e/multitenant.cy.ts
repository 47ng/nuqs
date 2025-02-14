import { createTest, type TestConfig } from 'e2e-shared/create-test'
import { getShallowUrl } from 'e2e-shared/specs/shallow.defs'

function testMultiTenant(options: TestConfig) {
  const factory = createTest('Multitenant', ({ path }) => {
    for (const shallow of [true, false]) {
      for (const history of ['replace', 'push'] as const) {
        it(`Updates with ({ shallow: ${shallow}, history: ${history} })`, () => {
          cy.visit(getShallowUrl(path, { shallow, history }))
          cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
          cy.get('#client-state').should('be.empty')
          cy.get('#server-state').should('be.empty')
          cy.get('#client-tenant').should('have.text', 'david')
          cy.get('#server-tenant').should('have.text', 'david')
          cy.get('#router-pathname').should(
            'have.text',
            options.nextJsRouter === 'pages'
              ? '/pages/multitenant/[tenant]'
              : '/app/multitenant'
          )
          cy.get('button').click()
          cy.get('#client-state').should('have.text', 'pass')
          cy.get('#client-tenant').should('have.text', 'david')
          cy.get('#server-tenant').should('have.text', 'david')
          cy.get('#router-pathname').should(
            'have.text',
            options.nextJsRouter === 'pages'
              ? '/pages/multitenant/[tenant]'
              : '/app/multitenant'
          )
          if (shallow === false) {
            cy.get('#server-state').should('have.text', 'pass')
          } else {
            cy.get('#server-state').should('be.empty')
          }
          if (history !== 'push') {
            return
          }
          cy.go('back')
          cy.get('#client-tenant').should('have.text', 'david')
          cy.get('#server-tenant').should('have.text', 'david')
          cy.get('#client-state').should('be.empty')
          cy.get('#server-state').should('be.empty')
          cy.get('#router-pathname').should(
            'have.text',
            options.nextJsRouter === 'pages'
              ? '/pages/multitenant/[tenant]'
              : '/app/multitenant'
          )
        })
      }
    }
  })

  return factory(options)
}

testMultiTenant({
  path: '/app/multitenant',
  nextJsRouter: 'app'
})

testMultiTenant({
  path: '/pages/multitenant',
  nextJsRouter: 'pages'
})
