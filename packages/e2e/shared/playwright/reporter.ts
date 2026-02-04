import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestError,
  TestResult
} from '@playwright/test/reporter'
import { styleText } from 'node:util'

const validateStream = false // force color output

const statusSymbols: Record<TestResult['status'], string> = {
  passed: styleText('green', '✓', { validateStream }),
  failed: styleText('red', '✗', { validateStream }),
  skipped: styleText(['dim', 'yellow'], '~', { validateStream }),
  timedOut: styleText('red', '!', { validateStream }),
  interrupted: styleText('cyan', '?', { validateStream })
}

function dim(text: string) {
  return styleText(['dim'], text, { validateStream })
}

function logIf(message: string | undefined) {
  if (!message) return
  const formatted = message
    .split('\n')
    .map(line => dim('  │ ') + line)
    .join('\n')
  console.log(formatted)
}

class MyReporter implements Reporter {
  private resultIndex = new Map<TestResult, string>()
  private padding = 1
  private totalTests = 0
  private failedTests = 0

  onBegin(config: FullConfig, suite: Suite) {
    const jobs = config.metadata.actualWorkers ?? config.workers
    const shardDetails = config.shard
      ? `, shard ${config.shard.current} of ${config.shard.total}`
      : ''
    this.totalTests = suite.allTests().length
    this.padding = String(this.totalTests).length
    const log =
      '\n' +
      dim('Running ') +
      this.totalTests +
      dim(` test${this.totalTests !== 1 ? 's' : ''} using `) +
      jobs +
      dim(` worker${jobs !== 1 ? 's' : ''}${shardDetails}`)
    console.log(log)
  }

  onTestBegin(test: TestCase, result: TestResult) {
    const index = String(this.resultIndex.size + 1).padStart(this.padding)
    this.resultIndex.set(result, `${index}/${this.totalTests}`)
  }

  onTestEnd(test: TestCase, result: TestResult) {
    if (['failed', 'timedOut', 'interrupted'].includes(result.status)) {
      this.failedTests++
    }
    const index = this.resultIndex.get(result) ?? ''
    const outcomeSymbol = statusSymbols[result.status]
    const indexStr = dim(String(index).padStart(this.padding))
    const titlePath = test
      .titlePath()
      .filter(
        part =>
          part && part.includes('.spec.ts') === false && part !== 'chromium'
      )
      .join(dim(' › '))
    const title = styleText(
      result.status !== 'passed' ? 'red' : [],
      titlePath,
      { validateStream }
    )
    const log = `${outcomeSymbol} ${title} ${indexStr}`
    console.log(log)
    for (const failure of result.errors) {
      console.log(dim('  ├── Cause:'))
      logIf(failure.stack)
      logIf(failure.snippet)
    }
    if (result.errors.length > 0) {
      console.log(dim('  └──'))
    }
  }

  onError(error: TestError) {
    // todo: Implement me
  }

  onEnd(result: FullResult) {
    if (result.status === 'passed') {
      const log = [
        styleText(['bgGreenBright'], ' PASS ', {
          validateStream
        }),
        'All',
        styleText('green', `${this.totalTests} tests passed.`, {
          validateStream
        })
      ].join(' ')
      return console.log(log)
    }
    if (result.status === 'failed') {
      const log = [
        styleText(['bgRedBright'], ' FAIL ', {
          validateStream
        }),
        styleText(
          'red',
          `${this.failedTests} of ${this.totalTests} tests failed.`,
          { validateStream }
        )
      ].join(' ')
      return console.log(log)
    }
  }
}

export default MyReporter
