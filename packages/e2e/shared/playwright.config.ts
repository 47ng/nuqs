import { determineAgent } from '@vercel/detect-agent'
import { defineConfig, devices } from '@playwright/test'
import { resolve } from 'node:path'

const { isAgent } = await determineAgent()

type ConfigurePlaywright = {
  startCommand: string
  port: number
  basePath?: string
}

export function configurePlaywright({
  startCommand,
  port,
  basePath = '/'
}: ConfigurePlaywright) {
  const customReporter = resolve(
    import.meta.dirname,
    'playwright',
    isAgent ? 'agent-reporter.ts' : 'reporter.ts'
  )
  return defineConfig({
    testDir: './specs',
    outputDir: '.playwright/test-results',
    fullyParallel: true,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 3 : undefined,
    timeout: 5_000,
    reporter: isAgent
      ? [[customReporter]]
      : [
          [customReporter],
          ['html', { open: 'never', outputFolder: '.playwright/report' }]
        ],
    use: {
      baseURL: ensureTrailingSlash(`http://localhost:${port}${basePath}`),
      trace: 'on-first-retry',
      screenshot: 'only-on-failure'
    },
    projects: [
      {
        name: 'chromium',
        use: { ...devices['Desktop Chrome'] }
      }
    ],
    webServer: {
      command: startCommand,
      url: `http://localhost:${port}${basePath}`,
      reuseExistingServer: !process.env.CI,
      env: {
        PORT: String(port)
      }
    }
  })
}

function ensureTrailingSlash(path: string) {
  return path.endsWith('/') ? path : path + '/'
}
