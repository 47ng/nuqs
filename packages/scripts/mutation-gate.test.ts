import { describe, expect, it } from 'vitest'
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
  config: MutationReport['config'] = comparableConfig
): MutationReport {
  return {
    files: {
      'src/example.ts': {
        mutants: statuses.map((status, id) => ({ id: String(id), status }))
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
    Object.assign(candidate.files['src/example.ts']!.mutants[0]!, {
      mutatorName: 'ConditionalExpression',
      replacement: 'false',
      location: { start: { line: 12, column: 4 } }
    })

    const result = compareMutationReports(baseline, candidate)
    expect(result).toMatchObject({ pass: false, delta: 1 })
    expect(result.newUndetected).toStrictEqual([
      {
        file: 'src/example.ts',
        id: '0',
        location: { start: { line: 12, column: 4 } },
        mutatorName: 'ConditionalExpression',
        previousStatus: 'Killed',
        replacement: 'false',
        status: 'Survived'
      }
    ])
    expect(formatNewUndetectedMutants(result.newUndetected)).toBe(
      'New undetected mutants:\n' +
        '- src/example.ts:12:4 [ConditionalExpression] Survived (was Killed): false\n'
    )
  })

  it('fails closed on mutation errors', () => {
    expect(() =>
      compareMutationReports(
        report(['Killed']),
        report(['Killed', 'RuntimeError'])
      )
    ).toThrow('candidate report contains 1 mutation error')
  })

  it('refuses to compare reports from different mutation configurations', () => {
    expect(() =>
      compareMutationReports(
        report(['Killed']),
        report(['Killed'], { ...comparableConfig, mutate: ['src/cache.ts'] })
      )
    ).toThrow('mutation configuration changed')
  })

  it('treats timeout configuration as result-affecting', () => {
    expect(() =>
      compareMutationReports(
        report(['Killed']),
        report(['Killed'], { ...comparableConfig, timeoutMS: 1 })
      )
    ).toThrow('mutation configuration changed')
  })

  it('refuses to compare reports from different mutation toolchains', () => {
    const candidate = report(['Killed'])
    candidate.framework.version = '10.0.0'

    expect(() => compareMutationReports(report(['Killed']), candidate)).toThrow(
      'mutation toolchain changed'
    )
  })

  it('fails closed on unknown mutant statuses', () => {
    const candidate = report(['Killed'])
    candidate.files['src/example.ts']!.mutants[0]!.status = 'Pending'

    expect(() => summarizeMutationReport(candidate)).toThrow(
      'unknown mutant status: Pending'
    )
  })
})
