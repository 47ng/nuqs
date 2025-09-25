import { createTest, type TestConfig } from '../create-test'
import { getOptionsUrl } from '../lib/options'

type TestRepro1099Options = TestConfig & {
  shallowOptions?: boolean[]
  historyOptions?: ('replace' | 'push')[]
}

export function testRepro1099({
  shallowOptions = [true, false],
  historyOptions = ['replace', 'push'],
  ...options
}: TestRepro1099Options) {
  const factory = createTest('repro-1099', ({ path }) => {
    for (const shallow of shallowOptions) {
      for (const history of historyOptions) {
        it(`should not emit null during updates with { shallow: ${shallow}, history: '${history}' }`, () => {
          cy.visit(getOptionsUrl(path, { history, shallow }), {
            onBeforeLoad(win) {
              win.localStorage.setItem('debug', 'nuqs')
            }
          })
          cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
          cy.get('#null-detector').should('have.text', 'pass')
          cy.get('button').click()
          cy.location('search').should('match', /test=pass$/)
          cy.get('#null-detector').should('have.text', 'pass')
        })
      }
    }
  })
  return factory(options)
}
