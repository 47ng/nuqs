import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, it } from 'node:test'
import { mergeMutationReports, readMutationReport } from './mutation-report.mjs'

const temporaryDirectories = []

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map(path => rm(path, { recursive: true }))
  )
})

describe('mutation report aggregation', () => {
  it('rejects source and test overlap', () => {
    const nodeWithSharedSource = report('src/shared.ts')
    const browserWithSharedSource = report('src/shared.ts')
    browserWithSharedSource.testFiles = {
      'src/browser.test.ts':
        browserWithSharedSource.testFiles['src/shared.test.ts']
    }
    assert.throws(
      () => mergeMutationReports(nodeWithSharedSource, browserWithSharedSource),
      /cannot combine duplicate source file: src\/shared\.ts/
    )
    const node = report('src/node.ts')
    const browser = report('src/browser.ts')
    browser.testFiles = node.testFiles
    assert.throws(
      () => mergeMutationReports(node, browser),
      /cannot combine duplicate test file: src\/node\.test\.ts/
    )
  })

  it('records strategy and distinct runtime settings', () => {
    const node = report('src/node.ts')
    const browser = report('src/browser.ts')
    node.config.timeoutMS = 1
    browser.config.timeoutMS = 2

    assert.deepEqual(mergeMutationReports(node, browser).config, {
      strategy: 'runtime-ownership-v1',
      node: { timeoutMS: 1 },
      browser: { timeoutMS: 2 }
    })
  })

  it('namespaces runtime ids and their references', () => {
    const node = report('src/node.ts')
    const browser = report('src/browser.ts')
    node.files['src/node.ts'].mutants[0].id = '7'
    node.testFiles['src/node.test.ts'].tests[0].id = '23'
    browser.files['src/browser.ts'].mutants[0].id = '11'
    browser.testFiles['src/browser.test.ts'].tests[0].id = '29'
    node.files['src/node.ts'].mutants[0].coveredBy = ['23']
    node.files['src/node.ts'].mutants[0].killedBy = ['23']
    browser.files['src/browser.ts'].mutants[0].coveredBy = ['29']
    browser.files['src/browser.ts'].mutants[0].killedBy = ['29']

    const merged = mergeMutationReports(node, browser)

    assert.equal(merged.files['src/node.ts'].mutants[0].id, 'node:7')
    assert.deepEqual(merged.files['src/node.ts'].mutants[0].coveredBy, [
      'node:23'
    ])
    assert.deepEqual(merged.files['src/node.ts'].mutants[0].killedBy, [
      'node:23'
    ])
    assert.equal(merged.testFiles['src/node.test.ts'].tests[0].id, 'node:23')
    assert.equal(merged.files['src/browser.ts'].mutants[0].id, 'browser:11')
    assert.deepEqual(merged.files['src/browser.ts'].mutants[0].coveredBy, [
      'browser:29'
    ])
    assert.deepEqual(merged.files['src/browser.ts'].mutants[0].killedBy, [
      'browser:29'
    ])
    assert.equal(
      merged.testFiles['src/browser.test.ts'].tests[0].id,
      'browser:29'
    )
  })

  it('reports the path and malformed field instead of an opaque TypeError', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'nuqs-mutation-report-'))
    temporaryDirectories.push(directory)
    const path = join(directory, 'malformed.json')
    await writeFile(path, JSON.stringify({ ...report('src/a.ts'), files: [] }))

    await assert.rejects(
      readMutationReport(path),
      error =>
        error instanceof Error &&
        error.message.includes(`invalid mutation report ${path}`) &&
        error.message.includes('files')
    )
  })
})

function report(sourcePath) {
  return {
    files: {
      [sourcePath]: {
        source: 'export const value = true',
        mutants: [{ id: '0', status: 'Killed' }]
      }
    },
    schemaVersion: '2',
    thresholds: {},
    testFiles: {
      [sourcePath.replace(/\.ts$/, '.test.ts')]: {
        source: '',
        tests: [{ id: '0', name: 'test' }]
      }
    },
    projectRoot: '/repo',
    config: {},
    framework: { name: 'StrykerJS', version: '9.6.1' }
  }
}
