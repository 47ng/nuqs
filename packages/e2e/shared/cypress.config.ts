import { defineConfig as defineCypressConfig } from 'cypress'
import cypressTerminalReport from 'cypress-terminal-report/src/installLogsPrinter'

type E2EOptions = NonNullable<Cypress.ConfigOptions['e2e']>
// Require the baseUrl option to be defined
type Config = Required<Pick<E2EOptions, 'baseUrl'>> &
  Omit<E2EOptions, 'baseUrl'>

export function defineConfig(config: Config) {
  return defineCypressConfig({
    e2e: {
      video: false,
      fixturesFolder: false,
      testIsolation: true,
      defaultCommandTimeout: 1000,
      setupNodeEvents(on) {
        cypressTerminalReport(on)
      },
      retries: {
        openMode: 0,
        runMode: process.env.CI ? 1 : 0
      },
      ...config,
      env: {
        ...config.env,
        CI: Boolean(process.env.CI)
      }
    }
  })
}
