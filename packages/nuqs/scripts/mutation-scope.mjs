import { readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, extname, relative, resolve } from 'node:path'

const sourceExtensions = new Set([
  '.cjs',
  '.cjsx',
  '.cts',
  '.ctsx',
  '.js',
  '.jsx',
  '.mjs',
  '.mjsx',
  '.mts',
  '.mtsx',
  '.ts',
  '.tsx'
])

const [root, reportPath] = process.argv.slice(2)
if (!root || !reportPath) {
  throw new Error('usage: mutation-scope.mjs <nuqs-root> <report>')
}

const loadJson = async path => JSON.parse(await readFile(path, 'utf8'))
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
  sourceFiles: await listSourceFiles(resolve(root, 'src')),
  node: selectScope(nodeReport),
  browser: selectScope(browserReport)
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

function selectScope(runtimeReport) {
  const effective = runtimeReport.config
  return {
    mutationFiles: Object.keys(runtimeReport.files).sort(),
    excludedMutations: [...effective.mutator.excludedMutations].sort(),
    ignorePatterns: effective.ignorePatterns,
    executedTests: Object.entries(runtimeReport.testFiles)
      .flatMap(([file, { tests }]) =>
        tests.map(test => `${file}\0${test.name}`)
      )
      .sort()
  }
}

async function listSourceFiles(directory) {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await listSourceFiles(path)))
    } else if (sourceExtensions.has(extname(entry.name))) {
      files.push(relative(root, path))
    }
  }
  return files.sort()
}
