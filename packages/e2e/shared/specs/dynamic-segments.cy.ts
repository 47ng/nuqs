import { createTest, type TestConfig } from '../create-test'
import { getOptionsUrl } from '../lib/options'

type TestDynamicSegmentsOptions = TestConfig & {
  expectedSegments: string[]
}

export function testDynamicSegments({
  expectedSegments,
  ...options
}: TestDynamicSegmentsOptions) {
  function expectSegments(environment: 'client' | 'server') {
    if (expectedSegments.length === 0) {
      cy.get(`#${environment}-segments`).should('be.empty')
    } else {
      cy.get(`#${environment}-segments`).should(
        'have.text',
        JSON.stringify(expectedSegments)
      )
    }
  }
  const factory = createTest('Dynamic segments', ({ path }) => {
    for (const shallow of [true, false]) {
      for (const history of ['replace', 'push'] as const) {
        it(`${path}: Updates with ({ shallow: ${shallow}, history: ${history} })`, () => {
          cy.visit(getOptionsUrl(path, { shallow, history }))
          cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
          cy.get('#client-state').should('be.empty')
          cy.get('#server-state').should('be.empty')
          expectSegments('server')
          expectSegments('client')
          cy.get('button').click()
          cy.get('#client-state').should('have.text', 'pass')
          expectSegments('server')
          expectSegments('client')
          if (shallow === false) {
            cy.get('#server-state').should('have.text', 'pass')
          } else {
            cy.get('#server-state').should('be.empty')
          }
          if (history !== 'push') {
            return
          }
          cy.go('back')
          cy.get('#client-state').should('be.empty')
          cy.get('#server-state').should('be.empty')
          expectSegments('server')
          expectSegments('client')
        })
      }
    }
  })
  return factory(options)
}
