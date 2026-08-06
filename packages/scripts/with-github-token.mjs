#!/usr/bin/env node

import { execFile, spawn } from 'node:child_process'
import { resolve } from 'node:path'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'

const execFileAsync = promisify(execFile)

async function readGhToken() {
  const { stdout } = await execFileAsync('gh', ['auth', 'token'], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024
  })
  return stdout
}

export async function resolveGithubToken({
  env,
  readGhToken: read = readGhToken
}) {
  const configured = env.GITHUB_TOKEN?.trim()
  if (configured) return configured
  try {
    const token = (await read()).trim()
    if (token) return token
  } catch {}
  throw new Error(
    'Docs need GitHub API authentication. Set GITHUB_TOKEN or authenticate gh with `gh auth login`.'
  )
}

function run(command, args, env) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { env, stdio: 'inherit' })
    child.on('error', reject)
    child.on('exit', (code, signal) => {
      if (code === 0) return resolvePromise()
      reject(
        new Error(
          `${command} ${args.join(' ')} failed` +
            (signal ? ` with signal ${signal}` : ` with exit code ${code}`)
        )
      )
    })
  })
}

async function main() {
  const [command, ...args] = process.argv.slice(2)
  if (!command) throw new Error('Expected a command to run')
  const token = await resolveGithubToken({ env: process.env })
  await run(command, args, { ...process.env, GITHUB_TOKEN: token })
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : ''
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(error.message)
    process.exitCode = 1
  })
}
