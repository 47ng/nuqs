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
import { expect, it } from 'vitest'

import {
  assertToolVersions,
  ensureDocsEnvironment,
  isLinkedWorktree,
  planHookSetup,
  prepareNodeModules,
  recordSetup,
  runWorktreeSetup,
  withSetupLock
} from './worktree-setup.mjs'

it('recognizes linked worktrees without treating the canonical checkout as one', async () => {
  const root = await mkdtemp(join(tmpdir(), 'nuqs-worktree-setup-'))
  await mkdir(join(root, '.git'))
  expect(await isLinkedWorktree(root)).toBe(false)

  const linked = await mkdtemp(join(tmpdir(), 'nuqs-worktree-setup-'))
  await writeFile(
    join(linked, '.git'),
    'gitdir: /tmp/repo/.git/worktrees/test\n'
  )
  expect(await isLinkedWorktree(linked)).toBe(true)
})

it('creates the docs environment once from the GitHub CLI credential', async () => {
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
  expect(await readFile(path, 'utf8')).toBe('GITHUB_TOKEN="from-gh"\n')
  expect((await stat(path)).mode & 0o777).toBe(0o600)
  expect(calls).toBe(1)
})

it('prefers an explicit GitHub token when creating the docs environment', async () => {
  const root = await mkdtemp(join(tmpdir(), 'nuqs-worktree-setup-'))
  await mkdir(join(root, 'packages/docs'), { recursive: true })

  await ensureDocsEnvironment(root, {
    env: { GITHUB_TOKEN: 'from-env' },
    readGhToken: async () => {
      throw new Error('should not read gh auth')
    }
  })

  expect(await readFile(join(root, 'packages/docs/.env.local'), 'utf8')).toBe(
    'GITHUB_TOKEN="from-env"\n'
  )
})

it('keeps setup usable when GitHub authentication is unavailable', async () => {
  const root = await mkdtemp(join(tmpdir(), 'nuqs-worktree-setup-'))
  await mkdir(join(root, 'packages/docs'), { recursive: true })
  const warnings = []

  await expect(
    ensureDocsEnvironment(root, {
      env: {},
      readGhToken: async () => {
        throw new Error('gh is unavailable')
      },
      warn: message => warnings.push(message)
    })
  ).resolves.toBe(false)
  expect(warnings).toEqual([
    'Docs GitHub authentication was not configured; set GITHUB_TOKEN or run `gh auth login` before building the docs.'
  ])
})

it('rejects a Node version that differs from .node-version', () => {
  expect(() =>
    assertToolVersions(
      { node: '24.10.0', pnpm: '11.0.9' },
      { node: '24.11.0', pnpm: '11.0.9' }
    )
  ).toThrow(/Node 24\.11\.0 is required/)
})

it('rejects a pnpm version that differs from packageManager', () => {
  expect(() =>
    assertToolVersions(
      { node: '24.11.0', pnpm: '10.0.0' },
      { node: '24.11.0', pnpm: '11.0.9' }
    )
  ).toThrow(/pnpm 11\.0\.9 is required/)
})

it('unlinks foreign root and package node_modules symlinks without touching their targets', async () => {
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

  expect(removed.sort()).toEqual([packageLink, rootLink].sort())
  await expect(readlink(rootLink)).rejects.toThrow()
  await expect(readlink(packageLink)).rejects.toThrow()
  expect(
    await import('node:fs/promises').then(({ readFile }) =>
      readFile(join(foreign, 'sentinel'), 'utf8')
    )
  ).toBe('foreign install')
})

it('hook setup skips work when the install fingerprint is current', () => {
  expect(
    planHookSetup({
      current: { install: 'lock-a' },
      previous: { install: 'lock-a' },
      hasDependencies: true
    })
  ).toEqual({ install: false })
})

it('hook setup reinstalls when install inputs change', () => {
  expect(
    planHookSetup({
      current: { install: 'lock-b' },
      previous: { install: 'lock-a' },
      hasDependencies: true
    })
  ).toEqual({ install: true })
})

it('installs from the lockfile without building packages directly', async () => {
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

  expect(commands).toEqual([['pnpm', 'install', '--frozen-lockfile', '1']])
})

it('checkout hooks do not persist GitHub credentials', async () => {
  const root = await mkdtemp(join(tmpdir(), 'nuqs-worktree-setup-'))
  await mkdir(join(root, 'packages/docs'), { recursive: true })
  let credentialReads = 0

  await runWorktreeSetup({
    root,
    actualVersions: { node: '24.11.0', pnpm: '11.0.9' },
    expectedVersions: { node: '24.11.0', pnpm: '11.0.9' },
    configureDocs: false,
    env: {},
    readGhToken: async () => {
      credentialReads++
      return 'secret'
    },
    run: async () => {}
  })

  expect(credentialReads).toBe(0)
  await expect(
    readFile(join(root, 'packages/docs/.env.local'), 'utf8')
  ).rejects.toMatchObject({ code: 'ENOENT' })
})

it('does not keep a current fingerprint after setup fails', async () => {
  const root = await mkdtemp(join(tmpdir(), 'nuqs-worktree-setup-'))
  const statePath = join(root, 'state.json')
  await writeFile(statePath, '{"install":"old"}\n')

  await expect(
    recordSetup({
      statePath,
      current: { install: 'new' },
      operation: async () => {
        throw new Error('install failed')
      }
    })
  ).rejects.toThrow(/install failed/)
  await expect(readFile(statePath, 'utf8')).rejects.toMatchObject({
    code: 'ENOENT'
  })
})

it('reclaims a setup lock owned by a dead process', async () => {
  const gitDirectory = await mkdtemp(join(tmpdir(), 'nuqs-worktree-setup-'))
  const lockPath = join(gitDirectory, 'nuqs-worktree-setup.lock')
  await writeFile(lockPath, '999999999\n')

  await expect(withSetupLock(gitDirectory, async () => 'ready')).resolves.toBe(
    'ready'
  )
  await expect(readFile(lockPath, 'utf8')).rejects.toMatchObject({
    code: 'ENOENT'
  })
})

it('does not reclaim a setup lock owned by a live process', async () => {
  const gitDirectory = await mkdtemp(join(tmpdir(), 'nuqs-worktree-setup-'))
  const lockPath = join(gitDirectory, 'nuqs-worktree-setup.lock')
  await writeFile(lockPath, `${process.pid}\n`)

  await expect(
    withSetupLock(gitDirectory, async () => 'unreachable')
  ).rejects.toThrow(/Another worktree setup is already running/)
  expect(await readFile(lockPath, 'utf8')).toBe(`${process.pid}\n`)
})
