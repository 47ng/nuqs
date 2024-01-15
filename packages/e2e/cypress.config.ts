import { defineConfig } from 'cypress'
import fs from 'node:fs'
import semver from 'semver'

const basePath =
  process.env.BASE_PATH === '/' ? '' : process.env.BASE_PATH ?? ''

const windowHistorySupport = supportsWHS()
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
      windowHistorySupport
    }
  }
})

function supportsWHS() {
  const pkgPath = new URL('./package.json', import.meta.url)
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
  const nextVersion: string = pkg.dependencies.next
  return (
    semver.gte(nextVersion, '14.0.3-canary.6') &&
    semver.lt(nextVersion, '14.0.5-canary.54')
  )
}
