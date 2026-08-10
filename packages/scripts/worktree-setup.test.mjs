import { execFile } from 'node:child_process'
import {
  mkdtemp,
  mkdir,
  readFile,
  readlink,
  symlink,
  unlink,
  writeFile
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, it } from 'vitest'

import {
  assertToolVersions,
  hookInstallSourcePaths,
  isLinkedWorktree,
  planHookSetup,
  prepareNodeModules,
  recordSetup,
  runWorktreeSetup,
  verifyHookInstallSources,
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

function gitStub(overrides = {}) {
  return async args => {
    const result = overrides[args[0]]
    if (result) return result
    return { code: 0, stdout: '' }
  }
}

it('trusts hook installs only when dependency manifests match the trusted ref', async () => {
  await expect(
    verifyHookInstallSources('/repo', { git: gitStub() })
  ).resolves.toEqual({ trusted: true })

  await expect(
    verifyHookInstallSources('/repo', {
      git: gitStub({ 'rev-parse': { code: 1, stdout: '' } })
    })
  ).resolves.toMatchObject({
    trusted: false,
    reason: expect.stringContaining('origin/HEAD is not available')
  })

  await expect(
    verifyHookInstallSources('/repo', {
      git: gitStub({ diff: { code: 1, stdout: '' } })
    })
  ).resolves.toMatchObject({
    trusted: false,
    reason: expect.stringContaining('differ from origin/HEAD')
  })

  await expect(
    verifyHookInstallSources('/repo', {
      git: gitStub({ 'ls-files': { code: 0, stdout: '.npmrc\n' } })
    })
  ).resolves.toMatchObject({
    trusted: false,
    reason: expect.stringContaining('untracked or ignored')
  })
})

it('throws when git itself fails instead of reporting untrusted manifests', async () => {
  await expect(
    verifyHookInstallSources('/repo', {
      git: gitStub({ diff: { code: 128, stdout: '' } })
    })
  ).rejects.toThrow(/git diff exited with code 128/)
  await expect(
    verifyHookInstallSources('/repo', {
      git: gitStub({ 'ls-files': { code: 128, stdout: '' } })
    })
  ).rejects.toThrow(/git ls-files exited with code 128/)
})

it('compares the dependency manifests that gate automatic installs', async () => {
  const calls = []
  await verifyHookInstallSources('/repo', {
    git: async args => {
      calls.push(args)
      return { code: 0, stdout: '' }
    }
  })
  expect(calls).toEqual([
    ['rev-parse', '--verify', '--quiet', 'origin/HEAD^{commit}'],
    ['diff', '--quiet', 'origin/HEAD', '--', ...hookInstallSourcePaths],
    ['ls-files', '--others', '--', ...hookInstallSourcePaths]
  ])
  expect(hookInstallSourcePaths).toContain(':(glob)packages/**/package.json')
  expect(hookInstallSourcePaths).toContain('.pnpmfile.cjs')
})

it('verifies dependency manifests against real git', async () => {
  const repo = await mkdtemp(join(tmpdir(), 'nuqs-worktree-setup-git-'))
  const git = (...args) =>
    new Promise((resolvePromise, reject) => {
      execFile(
        'git',
        args,
        {
          cwd: repo,
          env: {
            ...process.env,
            GIT_CONFIG_GLOBAL: '/dev/null',
            GIT_CONFIG_SYSTEM: '/dev/null'
          }
        },
        (error, stdout) => {
          if (error) reject(error)
          else resolvePromise(stdout)
        }
      )
    })
  await git('init', '--initial-branch=main')
  await git('config', 'user.email', 'test@example.com')
  await git('config', 'user.name', 'Test')
  await mkdir(join(repo, 'packages/nuqs'), { recursive: true })
  await writeFile(join(repo, 'package.json'), '{}\n')
  await writeFile(join(repo, 'pnpm-lock.yaml'), 'lockfileVersion: 9\n')
  await writeFile(join(repo, 'packages/nuqs/package.json'), '{}\n')
  await git('add', '--all')
  await git('commit', '--message', 'baseline')
  await git('branch', 'trusted')

  const options = { trustedRef: 'trusted' }
  await expect(verifyHookInstallSources(repo, options)).resolves.toEqual({
    trusted: true
  })

  await writeFile(join(repo, '.npmrc'), 'registry=https://evil.example\n')
  await expect(verifyHookInstallSources(repo, options)).resolves.toMatchObject({
    trusted: false,
    reason: expect.stringContaining('untracked')
  })

  await writeFile(join(repo, '.git/info/exclude'), '.npmrc\n')
  await expect(verifyHookInstallSources(repo, options)).resolves.toMatchObject({
    trusted: false,
    reason: expect.stringContaining('ignored')
  })
  await unlink(join(repo, '.npmrc'))

  await writeFile(
    join(repo, 'packages/nuqs/package.json'),
    '{"scripts":{"postinstall":"true"}}\n'
  )
  await git('add', '--all')
  await git('commit', '--message', 'workspace manifest change')
  await expect(verifyHookInstallSources(repo, options)).resolves.toMatchObject({
    trusted: false,
    reason: expect.stringContaining('differ')
  })
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

  await runWorktreeSetup({
    root,
    actualVersions: { node: '24.11.0', pnpm: '11.0.9' },
    expectedVersions: { node: '24.11.0', pnpm: '11.0.9' },
    run: async (command, args, options) =>
      commands.push([command, ...args, options?.env?.CI ?? null])
  })

  expect(commands).toEqual([['pnpm', 'install', '--frozen-lockfile', '1']])
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

it('does not write state through a planted symlink at the temporary path', async () => {
  const root = await mkdtemp(join(tmpdir(), 'nuqs-worktree-setup-'))
  const statePath = join(root, 'state.json')
  const victim = join(root, 'victim')
  await writeFile(victim, 'untouched')
  await symlink(victim, `${statePath}.${process.pid}.tmp`)

  await recordSetup({
    statePath,
    current: { install: 'fingerprint' },
    operation: async () => {}
  })

  expect(await readFile(victim, 'utf8')).toBe('untouched')
  expect(await readFile(statePath, 'utf8')).toBe('{"install":"fingerprint"}\n')
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

it('reclaims a corrupted (empty) setup lock instead of spinning forever', async () => {
  const gitDirectory = await mkdtemp(join(tmpdir(), 'nuqs-worktree-setup-'))
  const lockPath = join(gitDirectory, 'nuqs-worktree-setup.lock')
  await writeFile(lockPath, '')

  await expect(withSetupLock(gitDirectory, async () => 'ready')).resolves.toBe(
    'ready'
  )
})

it('self-heals a stale reclaim marker left by a dead process', async () => {
  const gitDirectory = await mkdtemp(join(tmpdir(), 'nuqs-worktree-setup-'))
  const lockPath = join(gitDirectory, 'nuqs-worktree-setup.lock')
  await writeFile(lockPath, '999999999\n')
  await writeFile(`${lockPath}.reclaim`, '999999999\n')

  await expect(withSetupLock(gitDirectory, async () => 'ready')).resolves.toBe(
    'ready'
  )
})

it('does not steal a reclaim marker owned by a live process', async () => {
  const gitDirectory = await mkdtemp(join(tmpdir(), 'nuqs-worktree-setup-'))
  const lockPath = join(gitDirectory, 'nuqs-worktree-setup.lock')
  await writeFile(lockPath, '999999999\n')
  await writeFile(`${lockPath}.reclaim`, `${process.pid}\n`)

  await expect(
    withSetupLock(gitDirectory, async () => 'unreachable')
  ).rejects.toThrow(/Another worktree setup is already running/)
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
