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
    expect(
      formatNewUndetectedMutants(
        result.newUndetected,
        'https://github.com/47ng/nuqs/blob/deadbeef',
        'packages/nuqs'
      )
    ).toBe(
      'New undetected mutants:\n' +
        '::error file=packages/nuqs/src/example.ts,line=12,col=5,title=New undetected mutant::ConditionalExpression Survived (was Killed)%0AOriginal: value > 0%0AMutated: false\n' +
        '- src/example.ts:12:5 [ConditionalExpression] Newly survived; previously killed\n' +
        '  Source: https://github.com/47ng/nuqs/blob/deadbeef/packages/nuqs/src/example.ts#L12\n' +
        '  Original: value > 0\n' +
        '  Mutated: false\n'
    )
  })

  it('matches mutants by source identity when Stryker renumbers them', () => {
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
      { id: '42', previousStatus: 'Killed', status: 'Survived' }
    ])
  })

  it('fails closed on mutation errors', () => {
    expect(() =>
      compareMutationReports(
        report(['Killed']),
        report(['Killed', 'RuntimeError'])
      )
    ).toThrow('candidate report contains 1 mutation error')
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
