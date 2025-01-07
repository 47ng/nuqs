import { createTest, TestConfig } from '../create-test'

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

const stubConsoleLog = {
  onBeforeLoad(window: any) {
    cy.stub(window.console, 'log').as('consoleLog')
  }
}

function assertLogCount(message: string, expectedCount: number) {
  cy.get('@consoleLog').then(spy => {
    // @ts-ignore
    const matchingLogs = spy.args.filter(args => args[0] === message)
    expect(matchingLogs.length).to.equal(expectedCount)
  })
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
      it(`should render ${times(expected.mount)} on mount`, () => {
        cy.visit(path, stubConsoleLog)
        cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
        assertLogCount('render', expected.mount)
      })
      it(`should then render ${times(expected.update)} on updates`, () => {
        cy.visit(path, stubConsoleLog)
        cy.contains('#hydration-marker', 'hydrated').should('be.hidden')
        cy.get('button').click()
        if (props.delay) {
          cy.wait(props.delay)
        }
        assertLogCount('render', expected.mount + expected.update)
        cy.get('#state').should('have.text', 'pass')
        cy.location('search').should('contain', 'test=pass')
      })
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
