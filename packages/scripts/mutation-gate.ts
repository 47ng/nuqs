#!/usr/bin/env -S node --no-warnings

import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

const DETECTED_STATUSES = new Set(['Killed', 'Timeout'])
const UNDETECTED_STATUSES = new Set(['Survived', 'NoCoverage'])
const ERROR_STATUSES = new Set(['CompileError', 'RuntimeError'])
const NON_RESULT_CONFIG_KEYS = new Set([
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

export type MutantStatus =
  | 'Killed'
  | 'Timeout'
  | 'Survived'
  | 'NoCoverage'
  | 'CompileError'
  | 'RuntimeError'
  | string

export type MutationReport = {
  files: Record<
    string,
    {
      mutants: Array<{
        id: string
        location?: { start: { line: number; column: number } }
        mutatorName?: string
        replacement?: string
        status: MutantStatus
      }>
    }
  >
  config: Record<string, unknown>
  framework: {
    name: string
    version: string
    dependencies?: Record<string, string>
  }
}

type MutationSummary = {
  detected: number
  errors: number
  killed: number
  noCoverage: number
  survived: number
  timeout: number
  total: number
  undetected: number
}

export type NewUndetectedMutant = {
  file: string
  id: string
  location?: { start: { line: number; column: number } }
  mutatorName?: string
  previousStatus?: MutantStatus
  replacement?: string
  status: MutantStatus
}

export function summarizeMutationReport(
  report: MutationReport
): MutationSummary {
  const summary: MutationSummary = {
    detected: 0,
    errors: 0,
    killed: 0,
    noCoverage: 0,
    survived: 0,
    timeout: 0,
    total: 0,
    undetected: 0
  }

  if (!report.files || typeof report.files !== 'object') {
    throw new Error('invalid mutation report: missing files')
  }

  for (const file of Object.values(report.files)) {
    if (!Array.isArray(file.mutants)) {
      throw new Error('invalid mutation report: missing mutants')
    }
    for (const mutant of file.mutants) {
      summary.total++
      if (DETECTED_STATUSES.has(mutant.status)) {
        summary.detected++
      } else if (UNDETECTED_STATUSES.has(mutant.status)) {
        summary.undetected++
      } else if (ERROR_STATUSES.has(mutant.status)) {
        summary.errors++
      } else {
        throw new Error(`unknown mutant status: ${mutant.status}`)
      }

      switch (mutant.status) {
        case 'Killed':
          summary.killed++
          break
        case 'Timeout':
          summary.timeout++
          break
        case 'Survived':
          summary.survived++
          break
        case 'NoCoverage':
          summary.noCoverage++
          break
      }
    }
  }

  return summary
}

function comparableConfig(config: Record<string, unknown>): string {
  return stableStringify(
    Object.fromEntries(
      Object.entries(config).filter(([key]) => !NON_RESULT_CONFIG_KEYS.has(key))
    )
  )
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(
      ([left], [right]) => left.localeCompare(right)
    )
    return `{${entries
      .map(([key, child]) => `${JSON.stringify(key)}:${stableStringify(child)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

export function compareMutationReports(
  baselineReport: MutationReport,
  candidateReport: MutationReport
): {
  baseline: MutationSummary
  candidate: MutationSummary
  delta: number
  newUndetected: NewUndetectedMutant[]
  pass: boolean
} {
  if (
    comparableConfig(baselineReport.config) !==
    comparableConfig(candidateReport.config)
  ) {
    throw new Error(
      'mutation configuration changed; establish and review a new baseline explicitly'
    )
  }
  if (
    JSON.stringify(baselineReport.framework) !==
    JSON.stringify(candidateReport.framework)
  ) {
    throw new Error(
      'mutation toolchain changed; establish and review a new baseline explicitly'
    )
  }

  const baseline = summarizeMutationReport(baselineReport)
  const candidate = summarizeMutationReport(candidateReport)
  if (baseline.errors > 0) {
    throw new Error(
      `baseline report contains ${baseline.errors} mutation error(s)`
    )
  }
  if (candidate.errors > 0) {
    throw new Error(
      `candidate report contains ${candidate.errors} mutation error(s)`
    )
  }

  const delta = candidate.undetected - baseline.undetected
  const baselineStatuses = new Map<string, MutantStatus>()
  for (const [file, { mutants }] of Object.entries(baselineReport.files)) {
    for (const mutant of mutants) {
      baselineStatuses.set(`${file}\0${mutant.id}`, mutant.status)
    }
  }
  const newUndetected = Object.entries(candidateReport.files)
    .flatMap(([file, { mutants }]) =>
      mutants.flatMap(mutant => {
        const previousStatus = baselineStatuses.get(`${file}\0${mutant.id}`)
        if (
          !UNDETECTED_STATUSES.has(mutant.status) ||
          (previousStatus && UNDETECTED_STATUSES.has(previousStatus))
        ) {
          return []
        }
        return [
          {
            file,
            id: mutant.id,
            location: mutant.location,
            mutatorName: mutant.mutatorName,
            previousStatus,
            replacement: mutant.replacement,
            status: mutant.status
          }
        ]
      })
    )
    .sort(
      (left, right) =>
        left.file.localeCompare(right.file) ||
        (left.location?.start.line ?? 0) - (right.location?.start.line ?? 0) ||
        (left.location?.start.column ?? 0) -
          (right.location?.start.column ?? 0) ||
        left.id.localeCompare(right.id)
    )
  return {
    baseline,
    candidate,
    delta,
    newUndetected,
    pass: delta <= 0
  }
}

export function formatNewUndetectedMutants(
  mutants: NewUndetectedMutant[]
): string {
  const lines = mutants.map(mutant => {
    const location = mutant.location
      ? `${mutant.file}:${mutant.location.start.line}:${mutant.location.start.column}`
      : mutant.file
    const previous = mutant.previousStatus
      ? ` (was ${mutant.previousStatus})`
      : ' (new)'
    const replacement = mutant.replacement
      ? `: ${mutant.replacement.replaceAll(/\s+/g, ' ').trim()}`
      : ''
    return `- ${location} [${mutant.mutatorName ?? 'Unknown'}] ${mutant.status}${previous}${replacement}`
  })
  return `New undetected mutants:\n${lines.join('\n')}\n`
}

async function readReport(path: string): Promise<MutationReport> {
  return JSON.parse(await readFile(path, 'utf8')) as MutationReport
}

async function main(): Promise<void> {
  const [baselinePath, candidatePath, ...extra] = process.argv.slice(2)
  if (!baselinePath || !candidatePath || extra.length > 0) {
    throw new Error(
      'usage: mutation-gate.ts <baseline-report.json> <candidate-report.json>'
    )
  }

  const result = compareMutationReports(
    await readReport(baselinePath),
    await readReport(candidatePath)
  )
  process.stdout.write(JSON.stringify(result, null, 2) + '\n')

  if (!result.pass) {
    process.stderr.write(
      `Mutation debt increased by ${result.delta}: ` +
        `${result.baseline.undetected} → ${result.candidate.undetected} ` +
        `survived or uncovered mutants.\n`
    )
    process.stderr.write(formatNewUndetectedMutants(result.newUndetected))
    process.exitCode = 1
  } else {
    process.stdout.write(
      `Mutation debt did not increase: ` +
        `${result.baseline.undetected} → ${result.candidate.undetected} ` +
        `survived or uncovered mutants.\n`
    )
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch(error => {
    process.stderr.write(`${(error as Error).message}\n`)
    process.exitCode = 2
  })
}
