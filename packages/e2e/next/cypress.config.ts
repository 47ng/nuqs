import { defineConfig } from 'e2e-shared/cypress.config'
import fs from 'node:fs'
import semver from 'semver'

const basePath =
  process.env.BASE_PATH === '/' ? '' : (process.env.BASE_PATH ?? '')

const nextJsVersion = readNextJsVersion()

export default defineConfig({
  baseUrl: `http://localhost:3001${basePath}`,
  env: {
    basePath,
    supportsShallowRouting: supportsShallowRouting(nextJsVersion),
    nextJsVersion
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
