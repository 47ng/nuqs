import { createTest, type TestConfig } from '../create-test'
import { getShallowUrl } from './shallow.defs'

type TestShallowOptions = TestConfig & {
  shallowOptions?: boolean[]
  historyOptions?: ('replace' | 'push')[]
}

export function testShallow({
  shallowOptions = [true, false],
  historyOptions = ['replace', 'push'],
  ...options
}: TestShallowOptions) {
  const factory = createTest('Shallow', ({ path }) => {
    for (const shallow of shallowOptions) {
      for (const history of historyOptions) {
        it(`Updates with ({ shallow: ${shallow}, history: ${history} })`, () => {
          cy.visit(getShallowUrl(path, { shallow, history }))
          cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
          cy.get('#client-state').should('be.empty')
          if (shallow === false) {
            cy.get('#server-state').should('be.empty')
          }
          cy.get('button').click()
          cy.get('#client-state').should('have.text', 'pass')
          if (shallow === false) {
            if (shallow) {
              cy.get('#server-state').should('be.empty')
            } else {
              cy.get('#server-state').should('have.text', 'pass')
            }
          }
          if (history !== 'push') {
            return
          }
          cy.go('back')
          cy.get('#client-state').should('be.empty')
          if (shallow === false) {
            cy.get('#server-state').should('be.empty')
          }
        })
      }
    }
  })
  return factory(options)
}
