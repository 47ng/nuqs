import assert from 'node:assert/strict'
import {
  mkdtemp,
  mkdir,
  readFile,
  readlink,
  stat,
  symlink,
  writeFile
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import {
  assertToolVersions,
  ensureDocsEnvironment,
  isLinkedWorktree,
  planHookSetup,
  prepareNodeModules,
  runWorktreeSetup
} from './worktree-setup.mjs'

test('recognizes linked worktrees without treating the canonical checkout as one', async () => {
  const root = await mkdtemp(join(tmpdir(), 'nuqs-worktree-setup-'))
  await mkdir(join(root, '.git'))
  assert.equal(await isLinkedWorktree(root), false)

  const linked = await mkdtemp(join(tmpdir(), 'nuqs-worktree-setup-'))
  await writeFile(
    join(linked, '.git'),
    'gitdir: /tmp/repo/.git/worktrees/test\n'
  )
  assert.equal(await isLinkedWorktree(linked), true)
})

test('creates the docs environment once from the GitHub CLI credential', async () => {
  const root = await mkdtemp(join(tmpdir(), 'nuqs-worktree-setup-'))
  await mkdir(join(root, 'packages/docs'), { recursive: true })
  let calls = 0

  await ensureDocsEnvironment(root, {
    env: {},
    readGhToken: async () => {
      calls++
      return 'from-gh\n'
    }
  })
  await ensureDocsEnvironment(root, {
    env: {},
    readGhToken: async () => {
      calls++
      return 'replacement'
    }
  })

  const path = join(root, 'packages/docs/.env.local')
  assert.equal(await readFile(path, 'utf8'), 'GITHUB_TOKEN="from-gh"\n')
  assert.equal((await stat(path)).mode & 0o777, 0o600)
  assert.equal(calls, 1)
})

test('prefers an explicit GitHub token when creating the docs environment', async () => {
  const root = await mkdtemp(join(tmpdir(), 'nuqs-worktree-setup-'))
  await mkdir(join(root, 'packages/docs'), { recursive: true })

  await ensureDocsEnvironment(root, {
    env: { GITHUB_TOKEN: 'from-env' },
    readGhToken: async () => {
      throw new Error('should not read gh auth')
    }
  })

  assert.equal(
    await readFile(join(root, 'packages/docs/.env.local'), 'utf8'),
    'GITHUB_TOKEN="from-env"\n'
  )
})

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
  await mkdir(join(root, 'packages/docs'), { recursive: true })

  await runWorktreeSetup({
    root,
    actualVersions: { node: '24.11.0', pnpm: '11.0.9' },
    expectedVersions: { node: '24.11.0', pnpm: '11.0.9' },
    env: { GITHUB_TOKEN: 'test-token' },
    run: async (command, args, options) =>
      commands.push([command, ...args, options?.env?.CI ?? null])
  })

  assert.deepEqual(commands, [['pnpm', 'install', '--frozen-lockfile', '1']])
})
