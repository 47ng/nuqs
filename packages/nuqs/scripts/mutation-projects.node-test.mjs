import assert from 'node:assert/strict'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, it } from 'node:test'
import {
  comparableMutationConfig,
  createMutationProjects
} from './mutation-projects.mjs'

const temporaryDirectories = []

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map(path => rm(path, { recursive: true }))
  )
})

describe('createMutationProjects', () => {
  it('derives disjoint runtime inputs from the explicit browser list', async () => {
    const root = await fixture({
      'src/useQueryState.ts': '',
      'src/useQueryState.browser.test.tsx': '',
      'src/cache.ts': '',
      'src/cache.browser.test.ts': '',
      'src/unlisted.ts': ''
    })

    const projects = createMutationProjects(root, [
      {
        mutate: 'src/useQueryState.ts',
        testFiles: ['src/useQueryState.browser.test.tsx']
      },
      {
        mutate: 'src/cache.ts',
        testFiles: ['src/cache.browser.test.ts']
      }
    ])

    assert.deepEqual(projects.browserMutate, [
      'src/cache.ts',
      'src/useQueryState.ts'
    ])
    assert.deepEqual(projects.browserTestFiles, [
      'src/cache.browser.test.ts',
      'src/useQueryState.browser.test.tsx'
    ])
    assert.deepEqual(projects.nodeMutate, [
      'src/**/*.{ts,tsx}',
      '!src/**/*.test.{ts,tsx}',
      '!src/adapters/**',
      '!src/cache.ts',
      '!src/useQueryState.ts'
    ])
  })

  it('rejects missing listed sources and tests', async () => {
    const root = await fixture({
      'src/present.ts': '',
      'src/present.browser.test.ts': ''
    })

    assert.throws(
      () =>
        createMutationProjects(root, [
          {
            mutate: 'src/missing.ts',
            testFiles: ['src/present.browser.test.ts']
          }
        ]),
      /browser mutation source does not exist: src\/missing\.ts/
    )
    assert.throws(
      () =>
        createMutationProjects(root, [
          {
            mutate: 'src/present.ts',
            testFiles: ['src/missing.browser.test.ts']
          }
        ]),
      /browser mutation test does not exist: src\/missing\.browser\.test\.ts/
    )
  })

  it('rejects duplicate sources', async () => {
    const root = await fixture({
      'src/cache.ts': '',
      'src/cache.browser.test.ts': ''
    })
    const project = {
      mutate: 'src/cache.ts',
      testFiles: ['src/cache.browser.test.ts']
    }

    assert.throws(
      () => createMutationProjects(root, [project, project]),
      /duplicate browser mutation source: src\/cache\.ts/
    )
  })

  it('allows sources to share a browser test', async () => {
    const root = await fixture({
      'src/first.ts': '',
      'src/second.ts': '',
      'src/shared.browser.test.ts': ''
    })

    const projects = createMutationProjects(root, [
      {
        mutate: 'src/first.ts',
        testFiles: ['src/shared.browser.test.ts']
      },
      {
        mutate: 'src/second.ts',
        testFiles: ['src/shared.browser.test.ts']
      }
    ])

    assert.deepEqual(projects.browserTestFiles, ['src/shared.browser.test.ts'])
  })

  it('compares strategy and runtime settings, not project file lists', () => {
    const config = comparableMutationConfig(
      { mutate: ['src/a.ts'], testFiles: ['src/a.test.ts'], timeoutMS: 1 },
      {
        mutate: ['src/b.ts'],
        testFiles: ['src/b.browser.test.ts'],
        timeoutMS: 2
      }
    )

    assert.deepEqual(config, {
      strategy: 'runtime-ownership-v1',
      node: { timeoutMS: 1 },
      browser: { timeoutMS: 2 }
    })
  })
})

async function fixture(files) {
  const root = await mkdtemp(join(tmpdir(), 'nuqs-mutation-projects-'))
  temporaryDirectories.push(root)
  await Promise.all(
    Object.entries(files).map(async ([path, contents]) => {
      const target = join(root, path)
      await mkdir(join(target, '..'), { recursive: true })
      await writeFile(target, contents)
    })
  )
  return root
}
