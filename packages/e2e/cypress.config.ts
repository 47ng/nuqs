import { defineConfig } from 'cypress'
import fs from 'node:fs'
import semver from 'semver'

const basePath =
  process.env.BASE_PATH === '/' ? '' : process.env.BASE_PATH ?? ''

const nextVersion = getNextVersion()

const windowHistorySupport = semver.gte(nextVersion, '14.0.3-canary.6')
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
    retries: 2,
    env: {
      basePath,
      windowHistorySupport,
      nextVersion
    }
  }
})

function getNextVersion(): string {
  const pkgPath = new URL('./package.json', import.meta.url)
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
  return pkg.dependencies.next
}
