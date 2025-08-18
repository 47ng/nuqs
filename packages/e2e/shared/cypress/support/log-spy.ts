export const stubConsoleLog = {
  onBeforeLoad(window: any) {
    cy.stub(window.console, 'log').as('consoleLog')
  }
}

export function assertLogCount(message: string, expectedCount: number) {
  cy.get('@consoleLog').then(spy => {
    // @ts-ignore
    const matchingLogs = spy.args.filter(args => args[0] === message)
    expect(matchingLogs.length).to.equal(expectedCount)
  })
}
