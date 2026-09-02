import { readFile } from 'node:fs/promises'
import { z } from 'zod'

const mutantSchema = z
  .object({
    id: z.string(),
    location: z
      .object({
        end: z.object({ line: z.number(), column: z.number() }),
        start: z.object({ line: z.number(), column: z.number() })
      })
      .optional(),
    mutatorName: z.string().optional(),
    replacement: z.string().optional(),
    coveredBy: z.array(z.string()).optional(),
    killedBy: z.array(z.string()).optional(),
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
    source: z.string(),
    mutants: z.array(mutantSchema)
  })
  .loose()
const mutationReportSchema = z.object({
  files: z.record(z.string(), mutationFileSchema),
  schemaVersion: z.string(),
  thresholds: z.record(z.string(), z.unknown()),
  testFiles: z.record(
    z.string(),
    z
      .object({
        source: z.string(),
        tests: z.array(z.object({ id: z.string(), name: z.string() }).loose())
      })
      .loose()
  ),
  projectRoot: z.string(),
  config: z.record(z.string(), z.unknown()),
  framework: z.record(z.string(), z.unknown())
})

export async function readMutationReport(path) {
  try {
    return mutationReportSchema.parse(JSON.parse(await readFile(path, 'utf8')))
  } catch (error) {
    throw new Error(`invalid mutation report ${path}: ${error.message}`, {
      cause: error
    })
  }
}

export function mergeMutationReports(nodeReport, browserReport) {
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

  const namespacedReports = reports.map((report, index) =>
    namespaceReport(report, index === 0 ? 'node' : 'browser')
  )

  return {
    files: Object.assign({}, ...namespacedReports.map(activeFiles)),
    schemaVersion: nodeReport.schemaVersion,
    thresholds: nodeReport.thresholds,
    testFiles: Object.assign(
      {},
      ...namespacedReports.map(report => report.testFiles)
    ),
    projectRoot: nodeReport.projectRoot,
    config: {
      strategy: 'runtime-ownership-v1',
      node: nodeReport.config,
      browser: browserReport.config
    },
    framework: nodeReport.framework
  }
}

function namespaceReport(report, runtime) {
  const testId = id => `${runtime}:${id}`
  return {
    ...report,
    files: Object.fromEntries(
      Object.entries(report.files).map(([path, file]) => [
        path,
        {
          ...file,
          mutants: file.mutants.map(mutant => ({
            ...mutant,
            id: `${runtime}:${mutant.id}`,
            ...(mutant.coveredBy && {
              coveredBy: mutant.coveredBy.map(testId)
            }),
            ...(mutant.killedBy && { killedBy: mutant.killedBy.map(testId) })
          }))
        }
      ])
    ),
    testFiles: Object.fromEntries(
      Object.entries(report.testFiles).map(([path, file]) => [
        path,
        {
          ...file,
          tests: file.tests.map(test => ({ ...test, id: testId(test.id) }))
        }
      ])
    )
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
