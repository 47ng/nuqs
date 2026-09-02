#!/usr/bin/env -S node --no-warnings

import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { z } from 'zod'

const DETECTED_STATUSES = new Set(['Killed', 'Timeout'])
const UNDETECTED_STATUSES = new Set(['Survived', 'NoCoverage'])
const ERROR_STATUSES = new Set(['CompileError', 'RuntimeError'])

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
      source: string
      mutants: Array<{
        id: string
        location?: {
          end: { line: number; column: number }
          start: { line: number; column: number }
        }
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
  schemaVersion: string
}

const mutationReportSchema: z.ZodType<MutationReport> = z.object({
  files: z.record(
    z.string(),
    z.object({
      source: z.string(),
      mutants: z.array(
        z.object({
          id: z.string(),
          location: z
            .object({
              end: z.object({ line: z.number(), column: z.number() }),
              start: z.object({ line: z.number(), column: z.number() })
            })
            .optional(),
          mutatorName: z.string().optional(),
          replacement: z.string().optional(),
          status: z.string()
        })
      )
    })
  ),
  config: z.record(z.string(), z.unknown()),
  framework: z.object({
    name: z.string(),
    version: z.string(),
    dependencies: z.record(z.string(), z.string()).optional()
  }),
  schemaVersion: z.string()
})

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

export type UndetectedMutant = {
  file: string
  id: string
  location?: {
    end: { line: number; column: number }
    start: { line: number; column: number }
  }
  mutatorName?: string
  original?: string
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

function sourceAtLocation(
  source: string,
  location?: UndetectedMutant['location']
): string | undefined {
  if (!location) {
    return undefined
  }
  const lines = source.split('\n')
  const { start, end } = location
  if (start.line === end.line) {
    return lines[start.line - 1]?.slice(start.column - 1, end.column - 1)
  }
  return [
    lines[start.line - 1]?.slice(start.column - 1),
    ...lines.slice(start.line, end.line - 1),
    lines[end.line - 1]?.slice(0, end.column - 1)
  ]
    .filter((line): line is string => line !== undefined)
    .join('\n')
}

export function compareMutationReports(
  baselineReport: MutationReport,
  candidateReport: MutationReport
): {
  baseline: MutationSummary
  candidate: MutationSummary
  delta: number
  candidateUndetected: UndetectedMutant[]
  pass: boolean
} {
  const baseline = summarizeMutationReport(baselineReport)
  const candidate = summarizeMutationReport(candidateReport)
  if (baselineReport.schemaVersion !== candidateReport.schemaVersion) {
    throw new Error('mutation report schema changed')
  }
  if (baseline.total === 0) {
    throw new Error('baseline report contains no mutants')
  }
  if (candidate.total === 0) {
    throw new Error('candidate report contains no mutants')
  }
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
  const candidateUndetected = Object.entries(candidateReport.files)
    .flatMap(([file, { mutants, source }]) =>
      mutants
        .filter(mutant => UNDETECTED_STATUSES.has(mutant.status))
        .map(mutant => ({
          file,
          id: mutant.id,
          location: mutant.location,
          mutatorName: mutant.mutatorName,
          original: sourceAtLocation(source, mutant.location),
          replacement: mutant.replacement,
          status: mutant.status
        }))
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
    candidateUndetected,
    delta,
    pass: delta <= 0
  }
}

export function formatUndetectedMutants(
  mutants: UndetectedMutant[],
  sourceBaseUrl?: string,
  sourceRoot?: string
): string {
  const lines = mutants.flatMap(mutant => {
    const line = mutant.location?.start.line
    const column = mutant.location?.start.column
    const location = line ? `${mutant.file}:${line}:${column}` : mutant.file
    const mutator = mutant.mutatorName ?? 'Unknown mutation'
    const original = oneLine(mutant.original) || '(source unavailable)'
    const replacement = oneLine(mutant.replacement) || '(empty)'
    const explanation = `Undetected mutant (${mutant.status.toLowerCase()})`
    const repositoryPath = [sourceRoot, mutant.file].filter(Boolean).join('/')
    const source =
      sourceBaseUrl && line
        ? `${sourceBaseUrl}/${repositoryPath
            .split('/')
            .map(encodeURIComponent)
            .join('/')}#L${line}`
        : undefined
    const annotation = line
      ? `::error file=${escapeCommandProperty(repositoryPath)},line=${line},col=${column},title=Undetected mutant::${escapeCommandData(`${mutator} ${mutant.status}\nOriginal: ${original}\nMutated: ${replacement}`)}`
      : undefined
    return [
      annotation,
      `- ${location} [${mutator}] ${explanation}${source ? `\n  Source: ${source}` : ''}\n  Original: ${original}\n  Mutated: ${replacement}`
    ].filter((value): value is string => value !== undefined)
  })
  return `Candidate undetected mutants:\n${lines.join('\n')}\n`
}

function oneLine(value?: string): string {
  return value?.replaceAll(/\s+/g, ' ').trim() ?? ''
}

function escapeCommandData(value: string): string {
  return value
    .replaceAll('%', '%25')
    .replaceAll('\r', '%0D')
    .replaceAll('\n', '%0A')
}

function escapeCommandProperty(value: string): string {
  return escapeCommandData(value).replaceAll(':', '%3A').replaceAll(',', '%2C')
}

async function readReport(path: string): Promise<MutationReport> {
  try {
    return mutationReportSchema.parse(JSON.parse(await readFile(path, 'utf8')))
  } catch (error) {
    throw new Error(`invalid mutation report ${path}`, { cause: error })
  }
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
    process.stderr.write(
      formatUndetectedMutants(
        result.candidateUndetected,
        process.env.MUTATION_SOURCE_URL,
        process.env.MUTATION_SOURCE_ROOT
      )
    )
    process.exitCode = 1
  } else {
    const outcome =
      result.delta === 0
        ? 'stayed identical'
        : `decreased by ${Math.abs(result.delta)}`
    process.stdout.write(
      `Mutation debt ${outcome}: ` +
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
