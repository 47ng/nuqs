import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const [root, reportPath] = process.argv.slice(2)
if (!root || !reportPath) {
  throw new Error('usage: mutation-scope.mjs <nuqs-root> <report>')
}

const loadJson = async path => JSON.parse(await readFile(path, 'utf8'))
const loadConfig = async name =>
  (await import(pathToFileURL(resolve(root, name)).href)).default
const nodeConfig = await loadConfig('stryker.node.config.mjs')
const browserConfig = await loadConfig('stryker.browser.config.mjs')
const report = await loadJson(reportPath)
const cache = resolve(dirname(reportPath), 'cache')
const nodeReport = await loadJson(resolve(cache, 'node.json'))
const browserReport = await loadJson(resolve(cache, 'browser.json'))
const packageJson = await loadJson(resolve(root, 'package.json'))

if (typeof report.config?.strategy !== 'string') {
  throw new Error('mutation report is missing its runtime ownership strategy')
}
if (typeof packageJson.scripts?.mutation !== 'string') {
  throw new Error('package is missing its mutation command')
}

report.files = mergeRuntimeFiles(nodeReport, browserReport)
report.config.scope = {
  strategy: report.config.strategy,
  command: packageJson.scripts.mutation,
  node: selectScope(nodeConfig, nodeReport),
  browser: selectScope(browserConfig, browserReport)
}

await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n')

function mergeRuntimeFiles(nodeReport, browserReport) {
  const files = {}
  for (const [runtime, runtimeReport] of [
    ['node', nodeReport],
    ['browser', browserReport]
  ]) {
    for (const [path, file] of Object.entries(runtimeReport.files)) {
      if (path in files) {
        throw new Error(`duplicate mutation source: ${path}`)
      }
      const testId = id => `${runtime}:${id}`
      files[path] = {
        ...file,
        mutants: file.mutants.map(mutant => ({
          ...mutant,
          id: testId(mutant.id),
          ...(mutant.coveredBy && {
            coveredBy: mutant.coveredBy.map(testId)
          }),
          ...(mutant.killedBy && { killedBy: mutant.killedBy.map(testId) })
        }))
      }
    }
  }
  return files
}

function selectScope(declared, effectiveReport) {
  const effective = effectiveReport.config
  return {
    mutate: declared.mutate,
    testPatterns: [...declared.testFiles].sort(),
    excludedMutations: [...effective.mutator.excludedMutations].sort(),
    ignoreStatic: effective.ignoreStatic,
    ignorers: [...effective.ignorers].sort(),
    ignorePatterns: effective.ignorePatterns,
    executedTests: Object.entries(effectiveReport.testFiles)
      .flatMap(([file, { tests }]) =>
        tests.map(test => `${file}\0${test.name}`)
      )
      .sort()
  }
}
