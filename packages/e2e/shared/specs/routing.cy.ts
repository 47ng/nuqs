import { createTest, type TestConfig } from '../create-test'
import { getRoutingUrl } from './routing.defs'

type TestRoutingOptions = TestConfig & {
  shallowOptions?: boolean[]
  methodOptions?: ('replace' | 'push')[]
}

export function testRouting({
  shallowOptions = [true, false],
  methodOptions = ['replace', 'push'],
  ...options
}: TestRoutingOptions) {
  const factory = createTest('Routing', ({ path }) => {
    for (const shallow of shallowOptions) {
      for (const method of methodOptions) {
        it(`picks up state from a router call pointing to the same page - router.${method}({ shallow: ${shallow} })`, () => {
          cy.visit(getRoutingUrl(path, { shallow, method }))
          cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
          cy.get('#state').should('be.empty')
          cy.get('button').click()
          cy.get('#state').should('have.text', 'pass')
          if (method === 'push') {
            cy.go('back')
            cy.get('#state').should('be.empty')
          }
        })

        it('picks up state from a router issued from another page', () => {
          cy.visit(getRoutingUrl(path + '/other', { shallow, method }))
          cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
          cy.get('#state').should('be.empty')
          cy.get('button').click()
          cy.get('#state').should('have.text', 'pass')
          if (method === 'push') {
            cy.go('back')
            cy.get('#state').should('be.empty')
          }
        })
      }
    }
  })
  return factory(options)
}
