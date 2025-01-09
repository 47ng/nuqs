import { createTest, type TestConfig } from '../create-test'
import { assertLogCount, stubConsoleLog } from '../cypress/support/log-spy'

type TestRenderCountConfig = TestConfig & {
  props: {
    shallow: boolean
    history: 'push' | 'replace'
    startTransition: boolean
    delay?: number
  }
  expected: {
    mount: number
    update: number
  }
}

export function testRenderCount({
  props,
  expected,
  ...config
}: TestRenderCountConfig) {
  const test = createTest(
    {
      label: 'Render count',
      variants:
        `shallow: ${props.shallow}, history: ${props.history}, startTransition: ${props.startTransition}` +
        (props.delay ? `, delay: ${props.delay}ms` : '')
    },
    ({ path }) => {
      it(
        `should render ${times(expected.mount)} on mount`,
        {
          ...(Cypress.env('CI') ? { retries: 4 } : undefined)
        },
        () => {
          cy.visit(path, stubConsoleLog)
          cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
          assertLogCount('render', expected.mount)
        }
      )
      it(
        `should then render ${times(expected.update)} on updates`,
        {
          ...(Cypress.env('CI') ? { retries: 4 } : undefined)
        },
        () => {
          cy.visit(path, stubConsoleLog)
          cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
          cy.get('button').click()
          if (props.delay) {
            cy.wait(props.delay)
          }
          cy.get('#state').should('have.text', 'pass')
          cy.location('search').should('contain', 'test=pass')
          assertLogCount('render', expected.mount + expected.update)
        }
      )
    }
  )
  return test(config)
}

function times(n: number) {
  if (n === 1) {
    return 'once'
  }
  return `${n} times`
}
