import { createTest, type TestConfig } from '../create-test'
import { getUrl } from './stitching.defs'

type Config = TestConfig & {
  enableShallowFalse?: boolean
}

export function testStitching({
  enableShallowFalse = true,
  ...config
}: Config) {
  const hooks = ['useQueryState', 'useQueryStates'] as const
  const shallows = enableShallowFalse ? [true, false] : [true]
  const histories = ['replace', 'push'] as const
  for (const hook of hooks) {
    for (const shallow of shallows) {
      for (const history of histories) {
        const test = createTest(
          {
            label: 'Stitching',
            variants: `shallow: ${shallow}, history: ${history}`
          },
          ({ path }) => {
            function assertSearch(shouldEqual: string) {
              cy.location('search').should(
                'equal',
                getUrl({ hook, shallow, history }) + '&' + shouldEqual
              )
            }

            it('should update the state optimistically and sequence the URL updates', () => {
              cy.visit(getUrl(path, { hook, shallow, history }))
              cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
              cy.get('#same-tick').click()
              cy.get('#client-state').should('have.text', '1,1,1')
              assertSearch('a=1')
              assertSearch('a=1&b=1')
              assertSearch('a=1&b=1&c=1')
              cy.get('#same-tick').click()
              cy.get('#client-state').should('have.text', '2,2,2')
              assertSearch('a=2&b=1&c=1')
              assertSearch('a=2&b=2&c=1')
              assertSearch('a=2&b=2&c=2')
              cy.get('#same-tick').click()
              cy.get('#client-state').should('have.text', '3,3,3')
              assertSearch('a=3&b=2&c=2')
              // Don't wait till completion, queue an update before the debounced resolve
              cy.get('#same-tick').click()
              cy.get('#client-state').should('have.text', '4,4,4')
              assertSearch('a=4&b=2&c=2')
              assertSearch('a=4&b=4&c=2')
              assertSearch('a=4&b=4&c=4')
            })

            it('should sequence updates when staggered', () => {
              cy.visit(getUrl(path, { hook, shallow, history }))
              cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
              cy.get('#staggered').click()
              cy.get('#client-state').should('have.text', '1,1,1')
              assertSearch('a=1')
              assertSearch('a=1&b=1')
              assertSearch('a=1&b=1&c=1')
              cy.get('#staggered').click()
              cy.get('#client-state').should('have.text', '2,2,2')
              assertSearch('a=2&b=1&c=1')
              assertSearch('a=2&b=2&c=1')
              assertSearch('a=2&b=2&c=2')
              cy.get('#staggered').click()
              cy.get('#client-state').should('have.text', '3,3,3')
              assertSearch('a=3&b=2&c=2')
              // Don't wait till completion, queue an update before the debounced resolve
              cy.get('#staggered').click()
              cy.get('#client-state').should('have.text', '4,4,4')
              assertSearch('a=4&b=2&c=2')
              assertSearch('a=4&b=4&c=2')
              assertSearch('a=4&b=4&c=4')
            })
          }
        )
        test({ ...config, hook })
      }
    }
  }
}
