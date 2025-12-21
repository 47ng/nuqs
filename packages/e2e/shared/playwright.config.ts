import { defineConfig, devices } from '@playwright/test'

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
  return defineConfig({
    testDir: './specs',
    outputDir: './node_modules/.playwright/test-results/',
    fullyParallel: true,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 3 : undefined,
    timeout: 5_000,
    reporter: [
      ['list', { printSteps: true }],
      process.env.CI ? ['github'] : ['html', { open: 'never' }]
    ],
    use: {
      baseURL: ensureTrailingSlash(`http://localhost:${port}${basePath}`),
      trace: 'on-first-retry'
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
