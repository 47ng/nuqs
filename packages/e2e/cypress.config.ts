import { defineConfig } from 'cypress'

const basePath =
  process.env.BASE_PATH === '/' ? '' : process.env.BASE_PATH ?? ''

const windowHistorySupport =
  process.env.WINDOW_HISTORY_SUPPORT === 'true' ? 'true' : 'undefined'

export default defineConfig({
  e2e: {
    baseUrl: `http://localhost:3001${basePath}`,
    video: false,
    fixturesFolder: false,
    supportFile: false,
    testIsolation: true,
    retries: 5,
    env: {
      basePath,
      windowHistorySupport
    }
  }
})
