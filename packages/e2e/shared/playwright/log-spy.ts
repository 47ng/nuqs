import type { ConsoleMessage, Page } from '@playwright/test'
import { expect } from '@playwright/test'

export type LogSpy = {
  logs: string[]
  [Symbol.dispose]: () => void
}

export function setupLogSpy(page: Page): LogSpy {
  const logs: string[] = []
  const handler = (msg: ConsoleMessage) => {
    if (msg.type() === 'log') {
      logs.push(msg.text())
    }
  }
  page.on('console', handler)
  return {
    logs,
    [Symbol.dispose]() {
      page.off('console', handler)
    }
  }
}

export function assertLogCount(
  logSpy: LogSpy,
  message: string,
  expectedCount: number
) {
  return expect
    .poll(() => logSpy.logs.filter(log => log === message).length)
    .toBe(expectedCount)
}
