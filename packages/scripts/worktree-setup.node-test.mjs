import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readlink, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import {
  assertToolVersions,
  planHookSetup,
  prepareNodeModules,
  runWorktreeSetup
} from './worktree-setup.mjs'

test('rejects a Node version that differs from .node-version', () => {
  assert.throws(
    () =>
      assertToolVersions(
        { node: '24.10.0', pnpm: '11.0.9' },
        { node: '24.11.0', pnpm: '11.0.9' }
      ),
    /Node 24\.11\.0 is required/
  )
})

test('rejects a pnpm version that differs from packageManager', () => {
  assert.throws(
    () =>
      assertToolVersions(
        { node: '24.11.0', pnpm: '10.0.0' },
        { node: '24.11.0', pnpm: '11.0.9' }
      ),
    /pnpm 11\.0\.9 is required/
  )
})

test('unlinks foreign root and package node_modules symlinks without touching their targets', async () => {
  const root = await mkdtemp(join(tmpdir(), 'nuqs-worktree-setup-'))
  const foreign = join(root, 'foreign-node-modules')
  const rootLink = join(root, 'node_modules')
  const packageLink = join(root, 'packages/example/node_modules')
  await mkdir(foreign)
  await mkdir(join(root, 'packages/example'), { recursive: true })
  await writeFile(join(foreign, 'sentinel'), 'foreign install')
  await symlink(foreign, rootLink)
  await symlink(foreign, packageLink)

  const removed = await prepareNodeModules(root)

  assert.deepEqual(removed.sort(), [packageLink, rootLink].sort())
  await assert.rejects(readlink(rootLink))
  await assert.rejects(readlink(packageLink))
  assert.equal(
    await import('node:fs/promises').then(({ readFile }) =>
      readFile(join(foreign, 'sentinel'), 'utf8')
    ),
    'foreign install'
  )
})

test('hook setup skips work when the install fingerprint is current', () => {
  assert.deepEqual(
    planHookSetup({
      current: { install: 'lock-a' },
      previous: { install: 'lock-a' },
      hasDependencies: true
    }),
    { install: false }
  )
})

test('hook setup reinstalls when install inputs change', () => {
  assert.deepEqual(
    planHookSetup({
      current: { install: 'lock-b' },
      previous: { install: 'lock-a' },
      hasDependencies: true
    }),
    { install: true }
  )
})

test('installs from the lockfile without building packages directly', async () => {
  const commands = []
  const root = await mkdtemp(join(tmpdir(), 'nuqs-worktree-setup-'))

  await runWorktreeSetup({
    root,
    actualVersions: { node: '24.11.0', pnpm: '11.0.9' },
    expectedVersions: { node: '24.11.0', pnpm: '11.0.9' },
    run: async (command, args, options) =>
      commands.push([command, ...args, options?.env?.CI ?? null])
  })

  assert.deepEqual(commands, [['pnpm', 'install', '--frozen-lockfile', '1']])
})
