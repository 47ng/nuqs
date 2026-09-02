import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import {
  compareMutationReports,
  formatUndetectedMutants,
  summarizeMutationReport,
  type MutationReport
} from './mutation-gate'

function report(
  statuses: Array<
    | 'Killed'
    | 'Timeout'
    | 'Survived'
    | 'NoCoverage'
    | 'Ignored'
    | 'RuntimeError'
  >,
  config: MutationReport['config'] = structuredClone(defaultConfig)
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
    },
    schemaVersion: '2'
  }
}

const defaultConfig = {
  mutate: ['src/**/*.ts'],
  testRunner: 'vitest',
  timeoutMS: 5000,
  vitest: { related: true },
  scope: {
    strategy: 'runtime-ownership-v1',
    command: 'node scripts/mutation.mjs',
    node: {
      mutate: ['src/**/*.ts'],
      testPatterns: ['src/**/*.test.ts'],
      excludedMutations: [],
      ignoreStatic: true,
      ignorers: [],
      ignorePatterns: [],
      executedTests: ['src/example.test.ts\0test']
    },
    browser: {
      mutate: ['src/browser.ts'],
      testPatterns: ['src/browser.test.ts'],
      excludedMutations: [],
      ignoreStatic: true,
      ignorers: [],
      ignorePatterns: [],
      executedTests: ['src/browser.test.ts\0test']
    }
  }
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
        report(['Killed', 'Timeout', 'Survived', 'NoCoverage', 'Ignored'])
      )
    ).toStrictEqual({
      debt: 3,
      detected: 2,
      errors: 0,
      ignored: 1,
      killed: 1,
      noCoverage: 1,
      survived: 1,
      timeout: 1,
      total: 5,
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
    expect(
      result.candidateUndetected.find(mutant => mutant.id === '0')
    ).toStrictEqual({
      file: 'src/example.ts',
      id: '0',
      location: {
        end: { line: 12, column: 14 },
        start: { line: 12, column: 5 }
      },
      mutatorName: 'ConditionalExpression',
      original: 'value > 0',
      replacement: 'false',
      status: 'Survived'
    })
    const formatted = formatUndetectedMutants(
      result.candidateUndetected,
      'https://github.com/47ng/nuqs/blob/deadbeef',
      'packages/nuqs'
    )
    expect(formatted).toContain(
      '::error file=packages/nuqs/src/example.ts,line=12,col=5,title=Undetected mutant::ConditionalExpression Survived%0AOriginal: value > 0%0AMutated: false'
    )
    expect(formatted).toContain(
      'https://github.com/47ng/nuqs/blob/deadbeef/packages/nuqs/src/example.ts#L12'
    )
    expect(formatted).toContain(
      '- src/example.ts:12:5 [ConditionalExpression] Undetected mutant (survived)'
    )
    expect(formatted).toContain('Original: value > 0')
    expect(formatted).toContain('Mutated: false')
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

  it('rejects mutation scope changes', () => {
    const candidateConfig = structuredClone(defaultConfig)
    candidateConfig.scope.node.mutate = ['src/cache.ts']

    expect(() =>
      compareMutationReports(
        report(['Killed']),
        report(['Survived'], candidateConfig)
      )
    ).toThrow('mutation scope changed')
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
