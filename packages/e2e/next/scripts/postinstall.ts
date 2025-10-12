#!/usr/bin/env node

import { rename } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import semver from 'semver'
import pkgJson from '../package.json' with { type: 'json' }

// For testing against pre-16 versions of Next.js
async function renameProxyIntoMiddleware() {
  console.dir({
    pkgVersion: pkgJson.dependencies.next
  })
  if (semver.gte(pkgJson.dependencies.next, '16.0.0-beta.0')) {
    return // No need to rename, use proxy.ts
  }
  try {
    const srcDir = resolve(basename(fileURLToPath(import.meta.url)), '../src')
    await rename(resolve(srcDir, 'proxy.ts'), resolve(srcDir, 'middleware.ts'))
    console.info('Renamed proxy.ts to middleware.ts for Next.js <16')
  } catch (error) {
    console.error('Error renaming proxy.ts to middleware.ts:', error)
  }
}

// --

if (import.meta.main) {
  await renameProxyIntoMiddleware()
}
