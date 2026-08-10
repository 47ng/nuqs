#!/usr/bin/env node

import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  access,
  lstat,
  readFile,
  readdir,
  rename,
  unlink,
  writeFile
} from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

function cleanVersion(value) {
  return value.trim().replace(/^v/, '')
}

export function assertToolVersions(actual, expected) {
  if (cleanVersion(actual.node) !== cleanVersion(expected.node)) {
    throw new Error(
      `Node ${expected.node} is required (found ${actual.node}). ` +
        'Activate the version from .node-version before setting up this worktree.'
    )
  }
  if (cleanVersion(actual.pnpm) !== cleanVersion(expected.pnpm)) {
    throw new Error(
      `pnpm ${expected.pnpm} is required (found ${actual.pnpm}). ` +
        'Use the packageManager version declared in package.json.'
    )
  }
}

export async function isLinkedWorktree(root) {
  const stats = await lstat(join(root, '.git'))
  return stats.isFile()
}

async function unlinkNodeModulesSymlink(path) {
  let stats
  try {
    stats = await lstat(path)
  } catch (error) {
    if (error.code === 'ENOENT') return false
    throw error
  }
  if (stats.isSymbolicLink()) {
    await unlink(path)
    return true
  }
  if (!stats.isDirectory()) {
    throw new Error(`${path} exists but is neither a directory nor a symlink`)
  }
  return false
}

export async function prepareNodeModules(root) {
  const removed = []
  const rootNodeModules = join(root, 'node_modules')
  if (await unlinkNodeModulesSymlink(rootNodeModules))
    removed.push(rootNodeModules)

  async function walk(directory) {
    let entries
    try {
      entries = await readdir(directory, { withFileTypes: true })
    } catch (error) {
      if (error.code === 'ENOENT') return
      throw error
    }
    for (const entry of entries) {
      const path = join(directory, entry.name)
      if (entry.name === 'node_modules') {
        if (await unlinkNodeModulesSymlink(path)) removed.push(path)
      } else if (entry.isDirectory()) {
        await walk(path)
      }
    }
  }

  await walk(join(root, 'packages'))
  return removed
}

export function planHookSetup({ current, previous, hasDependencies }) {
  const install = !hasDependencies || current.install !== previous?.install
  return { install }
}

function spawnCommand(command, args, options = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env ?? process.env,
      stdio: options.stdio ?? 'inherit'
    })
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

function commandSucceeds(command, args, root) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: 'ignore' })
    child.on('error', reject)
    child.on('exit', code => resolvePromise(code === 0))
  })
}

export async function verifyHookInstallSources(
  root,
  {
    trustedRef = 'origin/HEAD',
    paths = ['package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml', '.npmrc'],
    gitSucceeds = args => commandSucceeds('git', args, root)
  } = {}
) {
  const hasRef = await gitSucceeds([
    'rev-parse',
    '--verify',
    '--quiet',
    `${trustedRef}^{commit}`
  ])
  if (!hasRef) {
    return {
      trusted: false,
      reason: `${trustedRef} is not available to compare dependency manifests against`
    }
  }
  const unchanged = await gitSucceeds(['diff', '--quiet', trustedRef, '--', ...paths])
  if (!unchanged) {
    return {
      trusted: false,
      reason: `dependency manifests differ from ${trustedRef}`
    }
  }
  return { trusted: true }
}

async function capture(command, args, root) {
  let output = ''
  await new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      stdio: ['ignore', 'pipe', 'inherit']
    })
    child.stdout.setEncoding('utf8')
    child.stdout.on('data', chunk => {
      output += chunk
    })
    child.on('error', reject)
    child.on('exit', code => {
      if (code === 0) return resolvePromise()
      reject(
        new Error(`${command} ${args.join(' ')} failed with exit code ${code}`)
      )
    })
  })
  return output.trim()
}

async function readExpectedVersions(root) {
  const node = cleanVersion(await readFile(join(root, '.node-version'), 'utf8'))
  const packageJson = JSON.parse(
    await readFile(join(root, 'package.json'), 'utf8')
  )
  const match = /^pnpm@(.+)$/.exec(packageJson.packageManager ?? '')
  if (!match)
    throw new Error(
      'package.json must declare packageManager as pnpm@<version>'
    )
  return { node, pnpm: cleanVersion(match[1]) }
}

async function exists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function readFingerprints(root, expectedVersions) {
  const lockfile = await readFile(join(root, 'pnpm-lock.yaml'))
  const install = createHash('sha256')
    .update(lockfile)
    .update(`\nnode=${expectedVersions.node}\npnpm=${expectedVersions.pnpm}\n`)
    .digest('hex')
  return { install }
}

async function readState(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'))
  } catch (error) {
    if (error.code === 'ENOENT' || error instanceof SyntaxError) return null
    throw error
  }
}

async function writeState(path, fingerprints) {
  const temporary = `${path}.${process.pid}.tmp`
  const contents = JSON.stringify(fingerprints) + '\n'
  const options = { flag: 'wx', mode: 0o600 }
  try {
    await writeFile(temporary, contents, options)
  } catch (error) {
    if (error.code !== 'EEXIST') throw error
    await unlink(temporary)
    await writeFile(temporary, contents, options)
  }
  await rename(temporary, path)
}

export async function recordSetup({ statePath, current, operation }) {
  await unlink(statePath).catch(error => {
    if (error.code !== 'ENOENT') throw error
  })
  const result = await operation()
  await writeState(statePath, current)
  return result
}

function processIsAlive(pid) {
  if (!Number.isSafeInteger(pid) || pid <= 0) return false
  try {
    process.kill(pid, 0)
    return true
  } catch (error) {
    return error.code !== 'ESRCH'
  }
}

export async function withSetupLock(gitDirectory, operation) {
  const lockPath = join(gitDirectory, 'nuqs-worktree-setup.lock')
  const reclaimPath = `${lockPath}.reclaim`
  while (true) {
    try {
      await writeFile(lockPath, `${process.pid}\n`, {
        flag: 'wx',
        mode: 0o600
      })
      break
    } catch (error) {
      if (error.code !== 'EEXIST') throw error

      let owner
      try {
        owner = Number.parseInt(await readFile(lockPath, 'utf8'), 10)
      } catch (readError) {
        if (readError.code === 'ENOENT') continue
        throw readError
      }
      if (processIsAlive(owner)) {
        throw new Error(
          `Another worktree setup is already running (${lockPath})`
        )
      }

      try {
        await writeFile(reclaimPath, `${process.pid}\n`, {
          flag: 'wx',
          mode: 0o600
        })
      } catch (reclaimError) {
        if (reclaimError.code === 'EEXIST') {
          throw new Error(
            `Another worktree setup is already running (${lockPath})`
          )
        }
        throw reclaimError
      }
      try {
        const latest = Number.parseInt(await readFile(lockPath, 'utf8'), 10)
        if (latest === owner && !processIsAlive(latest)) await unlink(lockPath)
      } catch (reclaimError) {
        if (reclaimError.code !== 'ENOENT') throw reclaimError
      } finally {
        await unlink(reclaimPath).catch(() => {})
      }
    }
  }
  try {
    return await operation()
  } finally {
    await unlink(lockPath).catch(() => {})
  }
}

export async function runWorktreeSetup({
  root,
  actualVersions,
  expectedVersions,
  install = true,
  run = (command, args, options = {}) =>
    spawnCommand(command, args, {
      cwd: root,
      env: { ...process.env, ...options.env }
    })
}) {
  assertToolVersions(actualVersions, expectedVersions)
  const removedLinks = await prepareNodeModules(root)
  if (removedLinks.length > 0) {
    install = true
    console.log(
      `Removed ${removedLinks.length} worktree node_modules symlink(s); their targets were left untouched.`
    )
  }
  if (!install) return { install }
  await run('pnpm', ['install', '--frozen-lockfile'], { env: { CI: '1' } })
  return { install }
}

async function main() {
  const root = await capture(
    'git',
    ['rev-parse', '--show-toplevel'],
    process.cwd()
  )
  const hookMode = process.argv.includes('--hook')
  if (hookMode && !(await isLinkedWorktree(root))) return
  if (hookMode) {
    const sources = await verifyHookInstallSources(root)
    if (!sources.trusted) {
      console.warn(
        `Skipping automatic worktree setup: ${sources.reason}. ` +
          'Review the changes, then run `node --run setup:worktree` explicitly.'
      )
      return
    }
  }

  const expectedVersions = await readExpectedVersions(root)
  const actualVersions = {
    node: cleanVersion(process.version),
    pnpm: cleanVersion(await capture('pnpm', ['--version'], root))
  }

  const gitDirectory = await capture(
    'git',
    ['rev-parse', '--path-format=absolute', '--git-dir'],
    root
  )
  assertToolVersions(actualVersions, expectedVersions)
  await withSetupLock(gitDirectory, async () => {
    const current = await readFingerprints(root, expectedVersions)
    const statePath = join(gitDirectory, 'nuqs-worktree-setup.json')
    const plan = hookMode
      ? planHookSetup({
          current,
          previous: await readState(statePath),
          hasDependencies: await exists(join(root, 'node_modules'))
        })
      : { install: true }

    const completed = await recordSetup({
      statePath,
      current,
      operation: () =>
        runWorktreeSetup({
          root,
          actualVersions,
          expectedVersions,
          ...plan
        })
    })
    if (!completed.install) {
      console.log('Worktree setup is current.')
      return
    }
    console.log('Worktree ready: dependencies installed.')
    console.log('Turbo builds package dependencies for filtered checks.')
  })
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : ''
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(`Worktree setup failed: ${error.message}`)
    process.exitCode = 1
  })
}
