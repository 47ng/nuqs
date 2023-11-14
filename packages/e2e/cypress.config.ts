import { defineConfig } from 'cypress'
import fs from 'node:fs'

const pkgPath = new URL('./package.json', import.meta.url)
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))

const basePath =
  process.env.BASE_PATH === '/' ? '' : process.env.BASE_PATH ?? ''

const windowHistorySupport =
  pkg.dependencies.next >= '14.0.3-canary.6'
    ? process.env.WINDOW_HISTORY_SUPPORT === 'true'
      ? 'true'
      : 'false'
    : 'undefined'

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
