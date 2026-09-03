import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { computeVersion } from './compute-version'
import { readReleaseHistory } from './lib/git'

const temporaryDirectories: string[] = []
const gitEnvironment = { ...process.env }
delete gitEnvironment.GIT_DIR
delete gitEnvironment.GIT_WORK_TREE
gitEnvironment.GIT_CONFIG_GLOBAL = '/dev/null'
gitEnvironment.GIT_CONFIG_SYSTEM = '/dev/null'

function git(cwd: string, ...args: string[]): void {
  try {
    execFileSync('git', args, {
      cwd,
      env: gitEnvironment,
      stdio: 'pipe'
    })
  } catch (error) {
    const stderr = (error as { stderr?: Buffer }).stderr?.toString().trim()
    throw new Error(
      `git ${args.join(' ')} failed${stderr ? `: ${stderr}` : ''}`
    )
  }
}

function commit(cwd: string, message: string): void {
  git(cwd, 'commit', '--allow-empty', '-m', message)
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

describe('computeVersion with Git history', () => {
  it('raises the target when a feature lands after a patch beta', () => {
    const root = mkdtempSync(join(tmpdir(), 'nuqs-version-history-'))
    temporaryDirectories.push(root)
    const origin = join(root, 'origin.git')
    const repository = join(root, 'repository')

    git(root, 'init', '--bare', origin)
    git(root, 'init', '--initial-branch=next', repository)
    git(repository, 'config', 'user.name', 'Test User')
    git(repository, 'config', 'user.email', 'test@example.com')

    commit(repository, 'chore: initial release')
    git(repository, 'tag', 'v1.2.3')
    commit(repository, 'fix: a bug')
    git(repository, 'tag', 'v1.2.4-beta.1')
    commit(repository, 'feat: a feature')
    git(repository, 'remote', 'add', 'origin', origin)
    git(repository, 'push', '--tags', '--set-upstream', 'origin', 'next')

    const history = readReleaseHistory(repository)
    expect(computeVersion({ channel: 'beta', history })).toMatchObject({
      version: '1.3.0-beta.1',
      bump: 'minor'
    })
  })

  it('includes a branch merged after the latest beta tag', () => {
    const root = mkdtempSync(join(tmpdir(), 'nuqs-version-merge-'))
    temporaryDirectories.push(root)
    const origin = join(root, 'origin.git')
    const repository = join(root, 'repository')

    git(root, 'init', '--bare', origin)
    git(root, 'init', '--initial-branch=next', repository)
    git(repository, 'config', 'user.name', 'Test User')
    git(repository, 'config', 'user.email', 'test@example.com')

    commit(repository, 'chore: initial release')
    git(repository, 'tag', 'v1.0.0')
    git(repository, 'checkout', '-b', 'feature')
    commit(repository, 'feat: a feature')
    git(repository, 'checkout', 'next')
    commit(repository, 'fix: a bug')
    git(repository, 'tag', 'v1.0.1-beta.1')
    git(repository, 'merge', '--no-ff', 'feature', '-m', 'chore: merge feature')
    git(repository, 'remote', 'add', 'origin', origin)
    git(repository, 'push', '--tags', '--set-upstream', 'origin', 'next')

    const history = readReleaseHistory(repository)
    expect(computeVersion({ channel: 'beta', history })).toMatchObject({
      version: '1.1.0-beta.1',
      bump: 'minor'
    })
  })

  it('computes from the checked-out snapshot when origin/next advances', () => {
    const root = mkdtempSync(join(tmpdir(), 'nuqs-version-snapshot-'))
    temporaryDirectories.push(root)
    const origin = join(root, 'origin.git')
    const repository = join(root, 'repository')

    git(root, 'init', '--bare', origin)
    git(root, 'init', '--initial-branch=next', repository)
    git(repository, 'config', 'user.name', 'Test User')
    git(repository, 'config', 'user.email', 'test@example.com')

    commit(repository, 'chore: initial release')
    git(repository, 'tag', 'v1.0.0')
    commit(repository, 'fix: included in the snapshot')
    const snapshot = execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: repository,
      env: gitEnvironment,
      encoding: 'utf8'
    }).trim()
    git(repository, 'remote', 'add', 'origin', origin)
    git(repository, 'push', '--tags', '--set-upstream', 'origin', 'next')

    commit(repository, 'feat: merged after the workflow started')
    git(repository, 'tag', 'v1.1.0-beta.1')
    git(repository, 'push', '--tags', 'origin', 'next')
    git(repository, 'checkout', '--detach', snapshot)

    const history = readReleaseHistory(repository)
    expect(computeVersion({ channel: 'stable', history })).toMatchObject({
      version: '1.0.1',
      bump: 'patch'
    })
  })

  it('refuses to reuse a matching tag outside the release history', () => {
    const root = mkdtempSync(join(tmpdir(), 'nuqs-version-collision-'))
    temporaryDirectories.push(root)
    const repository = join(root, 'repository')

    git(root, 'init', '--initial-branch=next', repository)
    git(repository, 'config', 'user.name', 'Test User')
    git(repository, 'config', 'user.email', 'test@example.com')
    commit(repository, 'chore: initial release')
    git(repository, 'tag', 'v1.0.0')
    commit(repository, 'fix: a new bug')

    git(repository, 'checkout', '--orphan', 'unrelated')
    commit(repository, 'chore: unrelated release')
    git(repository, 'tag', 'v1.0.1')
    git(repository, 'checkout', 'next')

    try {
      execFileSync(
        process.execPath,
        [join(import.meta.dirname, 'compute-version.ts')],
        {
          cwd: repository,
          env: { ...gitEnvironment, CHANNEL: 'stable' },
          encoding: 'utf8',
          stdio: 'pipe'
        }
      )
      expect.fail('Expected the calculator to reject an existing tag')
    } catch (error) {
      const stderr = (error as { stderr?: string }).stderr ?? ''
      expect(stderr).toContain('Refusing to reuse existing release tag v1.0.1')
    }
  })
})
