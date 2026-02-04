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
const ellipsis = '…'

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

function dimYellow(text: string) {
  return styleText(['dim', 'yellow'], text, { validateStream })
}

function stripAnsi(text: string) {
  return text.replace(/\u001b\[[0-9;]*m/g, '')
}

function visibleWidth(text: string) {
  return stripAnsi(text).length
}

function fitTitleToScreen(title: string, prefix: string, suffix: string) {
  const width = process.stdout.columns
  if (!width) return title
  const available = width - visibleWidth(prefix) - visibleWidth(suffix)
  if (available <= 0) return ''
  if (title.length <= available) return title
  if (available <= ellipsis.length) {
    return title.slice(title.length - available)
  }
  const keep = available - ellipsis.length
  return ellipsis + title.slice(title.length - keep)
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

class MyReporter implements Reporter {
  private resultIndex = new Map<TestCase, string>()
  private testRows = new Map<TestCase, number>()
  private lastRow = 0
  private padding = 1
  private totalTests = 0
  private failedTests = 0
  private outputLocked = false
  private outputQueue: Array<() => void> = []
  private nextIndex = 1

  onBegin(config: FullConfig, suite: Suite) {
    const jobs = config.metadata.actualWorkers ?? config.workers
    const shardDetails = config.shard
      ? `, shard ${config.shard.current} of ${config.shard.total}`
      : ''
    this.totalTests = suite.allTests().length
    this.padding = String(this.totalTests).length
    const log =
      dim('Running ') +
      this.totalTests +
      dim(` test${this.totalTests !== 1 ? 's' : ''} using `) +
      jobs +
      dim(` worker${jobs !== 1 ? 's' : ''}${shardDetails}`)
    this.writeLine('')
    this.writeLine(log)
  }

  onTestBegin(test: TestCase, _result: TestResult) {
    let index = this.resultIndex.get(test)
    if (!index) {
      index = String(this.nextIndex++).padStart(this.padding)
      this.resultIndex.set(test, index)
    }
    if (!process.stdout.isTTY) return
    const titlePath = this.formatTitlePath(test)
    const prefix = `. ${index} `
    const suffix = ''
    const fittedTitle = fitTitleToScreen(titlePath, prefix, suffix)
    const line = dim(`${prefix}${fittedTitle}${suffix}`)
    this.updateOrAppendLine(test, line)
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const isFailureStatus = ['failed', 'timedOut', 'interrupted'].includes(
      result.status
    )
    const isFinalAttempt = !isFailureStatus || result.retry >= test.retries
    if (isFailureStatus && isFinalAttempt) {
      this.failedTests++
    }
    const index = this.resultIndex.get(test) ?? ''
    const outcomeSymbol = statusSymbols[result.status]
    const indexStr = dim(index)
    const titlePath = this.formatTitlePath(test)
    const prefix = `${outcomeSymbol} ${indexStr} `
    const suffix = this.formatResultSuffix(test, result, isFinalAttempt)
    const fittedTitle = fitTitleToScreen(titlePath, prefix, suffix)
    const title = styleText(
      result.status !== 'passed' ? 'red' : [],
      fittedTitle,
      { validateStream }
    )
    const log = `${prefix}${title}${suffix}`
    if (isFailureStatus && isFinalAttempt) {
      const blockLines: string[] = [log]
      if (result.errors.length > 0) {
        for (const failure of result.errors) {
          blockLines.push(dim('  ├── Cause:'))
          this.pushLogLines(blockLines, failure.stack)
          this.pushLogLines(blockLines, failure.snippet)
        }
        blockLines.push(dim('  └──'))
      }
      this.withOutputLock(() => {
        if (process.stdout.isTTY) {
          const row = this.testRows.get(test)
          if (row !== undefined) {
            this.updateLine(row, '')
            this.testRows.delete(test)
          }
        }
        this.writeBlock(blockLines)
      })
    } else {
      this.updateOrAppendLine(test, log)
    }
    if (isFinalAttempt) {
      this.resultIndex.delete(test)
      this.testRows.delete(test)
    }
  }

  onError(error: TestError) {
    // todo: Implement me
  }

  onEnd(result: FullResult) {
    if (result.status === 'passed') {
      const log = [
        styleText(['bgGreen'], ' PASS ', {
          validateStream
        }),
        'All',
        styleText('green', `${this.totalTests} tests passed`, {
          validateStream
        }),
        dim(`in ${formatDuration(result.duration)}`)
      ].join(' ')
      return console.log(log)
    }
    if (result.status === 'failed') {
      const log = [
        styleText(['bgRed'], ' FAIL ', {
          validateStream
        }),
        styleText(
          'red',
          `${this.failedTests} of ${this.totalTests} tests failed`,
          { validateStream }
        ),
        dim(`in ${formatDuration(result.duration)}`)
      ].join(' ')
      return console.log(log)
    }
  }

  private formatTitlePath(test: TestCase) {
    const titlePath = test
      .titlePath()
      .filter(part => {
        if (!part) return false
        if (part === 'chromium') return false
        return (
          part.includes('.spec.') === false && part.includes('.test.') === false
        )
      })
      .join(' › ')
    return titlePath || test.title
  }

  private updateOrAppendLine(test: TestCase, line: string) {
    if (!process.stdout.isTTY) return this.writeLine(line)
    if (this.outputLocked) {
      this.outputQueue.push(() => this.updateOrAppendLine(test, line))
      return
    }
    const row = this.testRows.get(test)
    const height = process.stdout.rows ?? 0
    if (row !== undefined && (height === 0 || this.lastRow - row < height)) {
      this.updateLine(row, line)
      return
    }
    this.testRows.set(test, this.lastRow)
    this.appendLine(line)
  }

  private appendLine(line: string) {
    this.writeLine(line)
  }

  private writeLine(line: string) {
    if (this.outputLocked) {
      this.outputQueue.push(() => this.writeLineUnlocked(line))
      return
    }
    this.writeLineUnlocked(line)
  }

  private writeLineUnlocked(line: string) {
    process.stdout.write(line)
    process.stdout.write('\n')
    this.lastRow++
  }

  private writeBlock(lines: string[]) {
    if (lines.length === 0) return
    process.stdout.write(`${lines.join('\n')}\n`)
    this.lastRow += lines.length
  }

  private pushLogLines(lines: string[], message: string | undefined) {
    if (!message) return
    for (const line of message.split('\n')) {
      lines.push(dim('  │ ') + line)
    }
  }

  private formatResultSuffix(
    test: TestCase,
    result: TestResult,
    isFinalAttempt: boolean
  ) {
    const parts: string[] = []
    const stepsCount = result.steps.length
    parts.push(dim(`${stepsCount} step${stepsCount === 1 ? '' : 's'}`))
    const retryLabel = this.formatRetrySuffix(test, result)
    if (retryLabel) parts.push(retryLabel)
    if (isFinalAttempt) {
      // Only show duration on final attempt to reduce retry clutter.
      parts.push(dim(formatDuration(result.duration)))
    }
    return ` ${parts.join(dim(' • '))}`
  }

  private formatRetrySuffix(test: TestCase, result: TestResult) {
    const totalAttempts = test.retries + 1
    if (totalAttempts <= 1) return ''
    if (result.retry === 0 && result.status === 'passed') return ''
    return dimYellow(`attempt ${result.retry + 1}/${totalAttempts}`)
  }

  private withOutputLock(action: () => void) {
    this.outputLocked = true
    try {
      action()
    } finally {
      this.outputLocked = false
      const queued = this.outputQueue
      this.outputQueue = []
      for (const flush of queued) {
        flush()
      }
    }
  }

  private updateLine(row: number, line: string) {
    let output = ''
    if (row !== this.lastRow) {
      output += `\u001B[${this.lastRow - row}A`
    }
    output += `\u001B[2K\u001B[0G${line}`
    if (row !== this.lastRow) {
      output += `\u001B[${this.lastRow - row}E`
    }
    process.stdout.write(output)
  }
}

export default MyReporter
