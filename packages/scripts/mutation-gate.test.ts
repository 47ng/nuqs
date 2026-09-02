import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import {
  compareMutationReports,
  formatNewUndetectedMutants,
  summarizeMutationReport,
  type MutationReport
} from './mutation-gate'

function report(
  statuses: Array<
    'Killed' | 'Timeout' | 'Survived' | 'NoCoverage' | 'RuntimeError'
  >,
  config: MutationReport['config'] = structuredClone(comparableConfig)
): MutationReport {
  return {
    files: {
      'src/example.ts': {
        mutants: statuses.map((status, id) => ({ id: String(id), status })),
        source: ''
      }
    },
    config,
    framework: {
      name: 'StrykerJS',
      version: '9.6.1',
      dependencies: { typescript: '7.0.2' }
    }
  }
}

const comparableConfig = {
  mutate: ['src/**/*.ts'],
  testRunner: 'vitest',
  timeoutMS: 5000,
  vitest: { related: true }
}

const temporaryDirectories: string[] = []

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true })
  }
})

function runGate(
  baseline: unknown,
  candidate: unknown,
  env: Record<string, string> = {}
) {
  const directory = mkdtempSync(join(tmpdir(), 'nuqs-mutation-gate-'))
  temporaryDirectories.push(directory)
  const baselinePath = join(directory, 'baseline.json')
  const candidatePath = join(directory, 'candidate.json')
  writeFileSync(baselinePath, JSON.stringify(baseline))
  writeFileSync(candidatePath, JSON.stringify(candidate))
  return spawnSync(
    process.execPath,
    [
      fileURLToPath(new URL('./mutation-gate.ts', import.meta.url)),
      baselinePath,
      candidatePath
    ],
    {
      encoding: 'utf8',
      env: { ...process.env, ...env },
      timeout: 10_000
    }
  )
}

describe('mutation gate', () => {
  it('classifies killed and timed-out mutants as detected', () => {
    expect(
      summarizeMutationReport(
        report(['Killed', 'Timeout', 'Survived', 'NoCoverage'])
      )
    ).toStrictEqual({
      detected: 2,
      errors: 0,
      killed: 1,
      noCoverage: 1,
      survived: 1,
      timeout: 1,
      total: 4,
      undetected: 2
    })
  })

  it('passes when mutation debt is stable or decreases', () => {
    expect(
      compareMutationReports(
        report(['Killed', 'Survived', 'NoCoverage']),
        report(['Killed', 'Killed', 'NoCoverage'])
      )
    ).toMatchObject({ pass: true, delta: -1 })

    expect(
      compareMutationReports(
        report(['Killed', 'Survived']),
        report(['Killed', 'NoCoverage'])
      )
    ).toMatchObject({ pass: true, delta: 0 })
  })

  it('fails when mutation debt increases', () => {
    const baseline = report(['Killed', 'Survived'])
    const candidate = report(['Survived', 'NoCoverage'])
    const identity = {
      mutatorName: 'ConditionalExpression',
      replacement: 'false',
      location: {
        end: { line: 12, column: 14 },
        start: { line: 12, column: 5 }
      }
    }
    Object.assign(baseline.files['src/example.ts']!.mutants[0]!, identity)
    Object.assign(candidate.files['src/example.ts']!.mutants[0]!, identity)
    candidate.files['src/example.ts']!.source =
      '\n'.repeat(11) + '    value > 0\n'

    const result = compareMutationReports(baseline, candidate)
    expect(result).toMatchObject({ pass: false, delta: 1 })
    expect(result.newUndetected).toStrictEqual([
      {
        file: 'src/example.ts',
        id: '0',
        location: {
          end: { line: 12, column: 14 },
          start: { line: 12, column: 5 }
        },
        mutatorName: 'ConditionalExpression',
        original: 'value > 0',
        previousStatus: 'Killed',
        replacement: 'false',
        status: 'Survived'
      }
    ])
    const formatted = formatNewUndetectedMutants(
      result.newUndetected,
      'https://github.com/47ng/nuqs/blob/deadbeef',
      'packages/nuqs'
    )
    expect(formatted).toContain(
      '::error file=packages/nuqs/src/example.ts,line=12,col=5,title=New undetected mutant::ConditionalExpression Survived (was Killed)%0AOriginal: value > 0%0AMutated: false'
    )
    expect(formatted).toContain(
      'https://github.com/47ng/nuqs/blob/deadbeef/packages/nuqs/src/example.ts#L12'
    )
    expect(formatted).toContain(
      '- src/example.ts:12:5 [ConditionalExpression] Newly survived; previously killed'
    )
    expect(formatted).toContain('Original: value > 0')
    expect(formatted).toContain('Mutated: false')
  })

  it('does not reconcile renumbered mutants by mutable source metadata', () => {
    const location = {
      end: { line: 1, column: 10 },
      start: { line: 1, column: 1 }
    }
    const baseline = report(['Killed'])
    Object.assign(baseline.files['src/example.ts']!.mutants[0]!, {
      id: '17',
      location,
      mutatorName: 'ConditionalExpression',
      replacement: 'false'
    })
    const candidate = report(['Survived'])
    Object.assign(candidate.files['src/example.ts']!.mutants[0]!, {
      id: '42',
      location,
      mutatorName: 'ConditionalExpression',
      replacement: 'false'
    })

    expect(
      compareMutationReports(baseline, candidate).newUndetected
    ).toMatchObject([
      { id: '42', previousStatus: undefined, status: 'Survived' }
    ])
  })

  it('includes the source file in mutant identity', () => {
    const baseline = report(['Killed'])
    baseline.files = { 'src/a.ts': baseline.files['src/example.ts']! }
    const candidate = report(['Survived'])
    candidate.files = { 'src/b.ts': candidate.files['src/example.ts']! }

    expect(
      compareMutationReports(baseline, candidate).newUndetected
    ).toMatchObject([{ file: 'src/b.ts', id: '0', previousStatus: undefined }])
  })

  it('fails closed on mutation errors', () => {
    expect(() =>
      compareMutationReports(
        report(['Killed']),
        report(['Killed', 'RuntimeError'])
      )
    ).toThrow('candidate report contains 1 mutation error')
    expect(() =>
      compareMutationReports(
        report(['Killed', 'RuntimeError']),
        report(['Killed'])
      )
    ).toThrow('baseline report contains 1 mutation error')
  })

  it('fails closed when the candidate report loses all mutants', () => {
    const candidate = report([])

    expect(() => compareMutationReports(report(['Killed']), candidate)).toThrow(
      'candidate report contains no mutants'
    )
  })

  it('refuses to compare reports from different mutation configurations', () => {
    expect(() =>
      compareMutationReports(
        report(['Killed']),
        report(['Killed'], { ...comparableConfig, mutate: ['src/cache.ts'] })
      )
    ).toThrow('mutation configuration changed')
  })

  it('accepts equivalent configurations and ignores operational settings', () => {
    const baseline = report(['Killed'], {
      ...structuredClone(comparableConfig),
      force: true,
      reporters: ['json']
    })
    const candidate = report(['Killed'], {
      vitest: { related: true },
      timeoutMS: 5000,
      testRunner: 'vitest',
      mutate: ['src/**/*.ts'],
      force: false,
      reporters: ['progress']
    })

    expect(compareMutationReports(baseline, candidate)).toMatchObject({
      pass: true,
      delta: 0
    })
  })

  it('treats timeout configuration as result-affecting', () => {
    expect(() =>
      compareMutationReports(
        report(['Killed']),
        report(['Killed'], { ...comparableConfig, timeoutMS: 1 })
      )
    ).toThrow('mutation configuration changed')
  })

  it('compares mutation debt across toolchain changes', () => {
    const candidate = report(['Killed'])
    candidate.framework.version = '10.0.0'

    expect(compareMutationReports(report(['Killed']), candidate)).toMatchObject(
      {
        pass: true,
        delta: 0
      }
    )
  })

  it('fails closed on unknown mutant statuses', () => {
    const candidate = report(['Killed'])
    candidate.files['src/example.ts']!.mutants[0]!.status = 'Pending'

    expect(() => summarizeMutationReport(candidate)).toThrow(
      'unknown mutant status: Pending'
    )
  })

  it('exits successfully when mutation debt does not increase', () => {
    const result = runGate(report(['Killed']), report(['Killed']))
    expect(result.error, result.stderr).toBeUndefined()
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('Mutation debt stayed identical')
  })

  it('exits with failure and forwards source-link settings for new debt', () => {
    const baseline = report(['Killed'])
    const candidate = report(['Survived'])
    Object.assign(candidate.files['src/example.ts']!.mutants[0]!, {
      location: {
        start: { line: 1, column: 1 },
        end: { line: 1, column: 5 }
      },
      mutatorName: 'BooleanLiteral',
      replacement: 'false'
    })
    candidate.files['src/example.ts']!.source = 'true'
    const result = runGate(baseline, candidate, {
      MUTATION_SOURCE_URL: 'https://github.com/47ng/nuqs/blob/deadbeef',
      MUTATION_SOURCE_ROOT: 'packages/nuqs'
    })

    expect(result.error, result.stderr).toBeUndefined()
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('Mutation debt increased by 1')
    expect(result.stderr).toContain(
      'https://github.com/47ng/nuqs/blob/deadbeef/packages/nuqs/src/example.ts#L1'
    )
  })

  it('exits with an error for malformed reports', () => {
    const result = runGate({}, report(['Killed']))
    expect(result.error, result.stderr).toBeUndefined()
    expect(result.status).toBe(2)
    expect(result.stderr).toContain('invalid mutation report')
  })
})
