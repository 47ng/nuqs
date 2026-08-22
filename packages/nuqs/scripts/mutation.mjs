import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { z } from 'zod'

const mutantSchema = z
  .object({
    status: z.enum([
      'CompileError',
      'Ignored',
      'Killed',
      'NoCoverage',
      'Pending',
      'RuntimeError',
      'Survived',
      'Timeout'
    ])
  })
  .loose()
const mutationFileSchema = z
  .object({
    mutants: z.array(mutantSchema)
  })
  .loose()
const mutationReportSchema = z.object({
  files: z.record(z.string(), mutationFileSchema),
  schemaVersion: z.string(),
  thresholds: z.record(z.string(), z.unknown()),
  testFiles: z.record(z.string(), z.unknown()),
  projectRoot: z.string(),
  config: z.record(z.string(), z.unknown()),
  framework: z.record(z.string(), z.unknown())
})

const reportDir = 'reports/mutation'
const cacheDir = join(reportDir, 'cache')
const aggregatePath = join(reportDir, 'stryker-incremental.json')
const htmlPath = join(reportDir, 'index.html')
const allowedArguments = new Set(['--force'])
const arguments_ = process.argv.slice(2).filter(argument => argument !== '--')

if (arguments_.some(argument => !allowedArguments.has(argument))) {
  throw new Error(`unsupported mutation argument: ${arguments_.join(' ')}`)
}

await mkdir(cacheDir, { recursive: true })
await runStryker('stryker.node.config.mjs')
await runStryker('stryker.browser.config.mjs')

const nodeReport = await readReport(join(cacheDir, 'node.json'))
const browserReport = await readReport(join(cacheDir, 'browser-hooks.json'))
const report = mergeReports(nodeReport, browserReport)

await writeFile(aggregatePath, JSON.stringify(report, null, 2) + '\n')
await writeFile(htmlPath, await renderHtml(report))
printSummary(report)
assertNoMutationErrors(report)

function runStryker(configFile) {
  return new Promise((resolve, reject) => {
    const child = spawn('stryker', ['run', configFile, ...arguments_], {
      stdio: 'inherit'
    })
    child.on('error', reject)
    child.on('exit', (code, signal) => {
      if (code === 0) {
        resolve()
      } else {
        reject(
          new Error(
            signal
              ? `${configFile} terminated by ${signal}`
              : `${configFile} exited with code ${code}`
          )
        )
      }
    })
  })
}

async function readReport(path) {
  return mutationReportSchema.parse(JSON.parse(await readFile(path, 'utf8')))
}

function mergeReports(nodeReport, browserReport) {
  const reports = [nodeReport, browserReport]
  for (const report of reports.slice(1)) {
    assertEqual(
      'schema version',
      nodeReport.schemaVersion,
      report.schemaVersion
    )
    assertEqual('project root', nodeReport.projectRoot, report.projectRoot)
    assertEqual('framework', nodeReport.framework, report.framework)
  }
  for (let left = 0; left < reports.length; left++) {
    for (let right = left + 1; right < reports.length; right++) {
      assertDisjoint('source file', reports[left].files, reports[right].files)
      assertDisjoint(
        'test file',
        reports[left].testFiles,
        reports[right].testFiles
      )
    }
  }

  return {
    files: Object.assign({}, ...reports.map(activeFiles)),
    schemaVersion: nodeReport.schemaVersion,
    thresholds: nodeReport.thresholds,
    testFiles: Object.assign({}, ...reports.map(report => report.testFiles)),
    projectRoot: nodeReport.projectRoot,
    config: {
      node: comparableConfig(nodeReport.config),
      browser: comparableConfig(browserReport.config)
    },
    framework: nodeReport.framework
  }
}

function activeFiles(report) {
  return Object.fromEntries(
    Object.entries(report.files).flatMap(([path, file]) => {
      const mutants = file.mutants.filter(mutant => mutant.status !== 'Ignored')
      return mutants.length === 0 ? [] : [[path, { ...file, mutants }]]
    })
  )
}

function assertEqual(label, left, right) {
  if (JSON.stringify(left) !== JSON.stringify(right)) {
    throw new Error(`cannot combine reports with different ${label}`)
  }
}

function assertDisjoint(label, left, right) {
  const duplicate = Object.keys(left).find(key => key in right)
  if (duplicate) {
    throw new Error(`cannot combine duplicate ${label}: ${duplicate}`)
  }
}

function comparableConfig(config) {
  const ignored = new Set([
    '$schema',
    'allowConsoleColors',
    'clearTextReporter',
    'dashboard',
    'eventReporter',
    'fileLogLevel',
    'force',
    'htmlReporter',
    'incremental',
    'incrementalFile',
    'jsonReporter',
    'logLevel',
    'reporters',
    'tempDirName',
    'warnings'
  ])
  return Object.fromEntries(
    Object.entries(config).filter(([key]) => !ignored.has(key))
  )
}

async function renderHtml(report) {
  const require = createRequire(import.meta.url)
  const corePackage = require.resolve('@stryker-mutator/core/package.json')
  const coreRequire = createRequire(corePackage)
  const elementsPath = coreRequire.resolve(
    'mutation-testing-elements/dist/mutation-test-elements.js'
  )
  const elements = await readFile(elementsPath, 'utf8')
  const json = JSON.stringify(report).replaceAll('<', '<"+"')

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script>${elements}</script>
</head>
<body>
  <mutation-test-report-app titlePostfix="Stryker"></mutation-test-report-app>
  <script>
    document.querySelector('mutation-test-report-app').report = ${json};
  </script>
</body>
</html>
`
}

function printSummary(report) {
  const statuses = Object.values(report.files)
    .flatMap(file => file.mutants)
    .map(mutant => mutant.status)
  const count = status =>
    statuses.filter(candidate => candidate === status).length
  const killed = count('Killed')
  const timeout = count('Timeout')
  const survived = count('Survived')
  const noCoverage = count('NoCoverage')
  const total = statuses.length
  const score = total === 0 ? 100 : ((killed + timeout) / total) * 100

  process.stdout.write(
    `Combined mutation score: ${score.toFixed(2)}% ` +
      `(${killed} killed, ${timeout} timeout, ${survived} survived, ` +
      `${noCoverage} no coverage, ${total} total)\n`
  )
}

function assertNoMutationErrors(report) {
  const errors = Object.values(report.files)
    .flatMap(file => file.mutants)
    .filter(mutant =>
      ['CompileError', 'RuntimeError'].includes(mutant.status)
    ).length
  if (errors > 0) {
    throw new Error(`mutation report contains ${errors} mutation error(s)`)
  }
}
