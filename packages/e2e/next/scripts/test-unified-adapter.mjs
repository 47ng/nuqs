#!/usr/bin/env node

import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

function run(command, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env,
      stdio: 'inherit'
    })
    child.on('error', reject)
    child.on('close', (code, signal) => {
      if (code === 0) return resolve()
      reject(
        new Error(
          `${command} ${args.join(' ')} failed` +
            (signal ? ` with signal ${signal}` : ` with exit code ${code}`)
        )
      )
    })
  })
}

const env = { ...process.env, NUQS_E2E_UNIFIED_ADAPTER: 'true' }
const nextBin = fileURLToPath(
  new URL('../node_modules/next/dist/bin/next', import.meta.url)
)
const playwrightBin = fileURLToPath(
  new URL('../node_modules/@playwright/test/cli.js', import.meta.url)
)

try {
  await run(process.execPath, [nextBin, 'build'], env)
  await run(
    process.execPath,
    [playwrightBin, 'test', '--project=chromium', '--grep', '@unified-adapter'],
    env
  )
} catch (error) {
  console.error(error)
  process.exitCode = 1
}
