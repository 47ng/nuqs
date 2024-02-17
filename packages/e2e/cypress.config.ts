import { defineConfig } from 'cypress'
import cypressTerminalReport from 'cypress-terminal-report/src/installLogsPrinter'
import fs from 'node:fs'
import semver from 'semver'

const basePath =
  process.env.BASE_PATH === '/' ? '' : (process.env.BASE_PATH ?? '')

const nextJsVersion = readNextJsVersion()

export default defineConfig({
  e2e: {
    baseUrl: `http://localhost:3001${basePath}`,
    video: false,
    fixturesFolder: false,
    testIsolation: true,
    setupNodeEvents(on) {
      cypressTerminalReport(on)
    },
    retries: 2,
    env: {
      basePath,
      supportsShallowRouting: supportsShallowRouting(nextJsVersion),
      nextJsVersion
    }
  }
})

function readNextJsVersion() {
  const pkgPath = new URL('./node_modules/next/package.json', import.meta.url)
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
  return pkg.version
}

function supportsShallowRouting(nextVersion: string) {
  return semver.gte(nextVersion, '14.1.0')
}
