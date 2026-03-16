import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestError,
  TestResult
} from '@playwright/test/reporter'

function stripAnsi(text: string) {
  return text.replace(/\u001b\[[0-9;]*m/g, '')
}

function formatDuration(durationMs: number) {
  if (durationMs < 1000) return `${Math.round(durationMs)}ms`
  if (durationMs < 60_000) {
    return `${(durationMs / 1000).toFixed(1).replace(/\.0$/, '')}s`
  }
  if (durationMs < 3_600_000) {
    return `${(durationMs / 60_000).toFixed(1).replace(/\.0$/, '')}m`
  }
  return `${(durationMs / 3_600_000).toFixed(1).replace(/\.0$/, '')}h`
}

export default class AgentReporter implements Reporter {
  private totalTests = 0
  private passedTests = 0
  private failedTests = 0
  private skippedTests = 0

  onBegin(_config: FullConfig, suite: Suite) {
    this.totalTests = suite.allTests().length
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const isFailure = result.status === 'failed' || result.status === 'timedOut'
    const isFinalAttempt = !isFailure || result.retry >= test.retries

    if (!isFinalAttempt) return

    if (isFailure) {
      this.failedTests++
      this.printFailure(test, result)
    } else if (result.status === 'skipped') {
      this.skippedTests++
    } else {
      this.passedTests++
    }
  }

  onError(error: TestError) {
    const message = stripAnsi(error.message ?? error.value ?? 'Unknown error')
    const lines = [`GLOBAL ERROR: ${message}`]
    if (error.stack) {
      lines.push('  Stack:')
      for (const line of stripAnsi(error.stack).split('\n')) {
        lines.push(`    ${line}`)
      }
    }
    lines.push('')
    process.stdout.write(lines.join('\n') + '\n')
  }

  onEnd(result: FullResult) {
    const parts: string[] = []
    if (this.passedTests > 0) {
      parts.push(`${this.passedTests} passed`)
    }
    if (this.failedTests > 0) {
      parts.push(`${this.failedTests} failed`)
    }
    if (this.skippedTests > 0) {
      parts.push(`${this.skippedTests} skipped`)
    }
    const summary = `Result: ${parts.join(', ')} (total ${this.totalTests} in ${formatDuration(result.duration)})`
    process.stdout.write(summary + '\n')
  }

  private printFailure(test: TestCase, result: TestResult) {
    const titlePath = test
      .titlePath()
      .filter(Boolean)
      .filter(
        part =>
          part !== 'chromium' &&
          !part.includes('.spec.') &&
          !part.includes('.test.')
      )
      .join(' > ')

    const lines = [`FAILED: ${titlePath || test.title}`]

    if (test.location) {
      lines.push(
        `  Location: ${test.location.file}:${test.location.line}:${test.location.column}`
      )
    }
    if (result.status === 'timedOut') {
      lines.push(`  Status: timedOut`)
    }
    if (test.retries > 0) {
      lines.push(`  Attempt: ${result.retry + 1}/${test.retries + 1}`)
    }

    const errors = result.errors
    if (errors.length === 1) {
      this.pushError(lines, errors[0])
    } else {
      for (let i = 0; i < errors.length; i++) {
        lines.push(`  Error ${i + 1}/${errors.length}:`)
        this.pushError(lines, errors[i])
      }
    }

    lines.push('')
    process.stdout.write(lines.join('\n') + '\n')
  }

  private pushError(lines: string[], error: TestError) {
    const message = stripAnsi(
      error.message ?? error.value ?? 'Unknown error'
    )
    for (const [i, line] of message.split('\n').entries()) {
      lines.push(i === 0 ? `  Error: ${line}` : `    ${line}`)
    }
    if (error.stack) {
      lines.push('  Stack:')
      for (const line of stripAnsi(error.stack).split('\n')) {
        lines.push(`    ${line}`)
      }
    }
  }
}
