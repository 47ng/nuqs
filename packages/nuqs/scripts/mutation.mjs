import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { mergeMutationReports, readMutationReport } from './mutation-report.mjs'

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

const nodeReport = await readMutationReport(join(cacheDir, 'node.json'))
const browserReport = await readMutationReport(join(cacheDir, 'browser.json'))
const report = mergeMutationReports(nodeReport, browserReport)

await writeFile(aggregatePath, JSON.stringify(report, null, 2) + '\n')
await writeFile(htmlPath, await renderHtml(report))
assertValidMutationReport(report)
printSummary(report)

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
  const ignored = count('Ignored')
  const active = statuses.filter(status => status !== 'Ignored').length
  const score = active === 0 ? 100 : ((killed + timeout) / active) * 100

  process.stdout.write(
    `Combined mutation score: ${score.toFixed(2)}% ` +
      `(${killed} killed, ${timeout} timeout, ${survived} survived, ` +
      `${noCoverage} no coverage, ${ignored} ignored, ${active} active)\n`
  )
}

function assertValidMutationReport(report) {
  const mutants = Object.values(report.files).flatMap(file => file.mutants)
  if (mutants.length === 0) {
    throw new Error('mutation report contains no mutants')
  }
  const errors = mutants.filter(mutant =>
    ['CompileError', 'RuntimeError'].includes(mutant.status)
  ).length
  if (errors > 0) {
    throw new Error(`mutation report contains ${errors} mutation error(s)`)
  }
  const incomplete = mutants.filter(
    mutant =>
      !['Killed', 'Timeout', 'Survived', 'NoCoverage', 'Ignored'].includes(
        mutant.status
      )
  ).length
  if (incomplete > 0) {
    throw new Error(
      `mutation report contains ${incomplete} incomplete mutant(s)`
    )
  }
}
