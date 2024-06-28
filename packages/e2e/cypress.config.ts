import { defineConfig } from 'cypress'
import fs from 'node:fs'
import semver from 'semver'

const basePath =
  process.env.BASE_PATH === '/' ? '' : process.env.BASE_PATH ?? ''

const nextJsVersion = readNextJsVersion()

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
      supportsShallowRouting: supportsShallowRouting(nextJsVersion),
      nextJsVersion
    }
  }
})

function readNextJsVersion() {
  const pkgPath = new URL('./package.json', import.meta.url)
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
  return pkg.dependencies.next.replace('^', '')
}

function supportsShallowRouting(nextVersion: string) {
  return semver.gte(nextVersion, '14.1.0')
}
