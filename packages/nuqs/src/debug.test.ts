import { afterEach, describe, expect, it, vi } from 'vitest'
import { disableNuqsDebugging, enableNuqsDebugging } from './debug'
import { debug, setDebugSink, warn } from './lib/debug'
import { debugMessages } from './lib/debug-messages'

describe('nuqs/debug opt-in', () => {
  afterEach(() => {
    setDebugSink(null)
    vi.restoreAllMocks()
  })

  it('debug/warn are no-ops until logging is enabled', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const wrn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    debug(1, 'id', 'key', {})
    warn(24, 'value', new Error('boom'))
    expect(log).not.toHaveBeenCalled()
    expect(wrn).not.toHaveBeenCalled()
  })

  it('enableNuqsDebugging resolves codes through the message catalog', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    enableNuqsDebugging()
    const args = ['id', 'key', { a: 1 }] as const
    debug(6, ...args)
    expect(log).toHaveBeenCalledExactlyOnceWith(debugMessages[6], ...args)
  })

  it('warn routes through console.warn with the catalog message', () => {
    const wrn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    enableNuqsDebugging()
    const cause = new Error('boom')
    warn(24, 'value', cause)
    expect(wrn).toHaveBeenCalledExactlyOnceWith(
      debugMessages[24],
      'value',
      cause
    )
  })

  it('unknown codes are ignored', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    enableNuqsDebugging()
    // @ts-expect-error — 9999 is not a valid DebugCode; this asserts the catalog
    // rejects unknown codes at compile time, and that they no-op at runtime.
    debug(9999)
    expect(log).not.toHaveBeenCalled()
  })

  it('disableNuqsDebugging restores the no-op behaviour', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    enableNuqsDebugging()
    disableNuqsDebugging()
    debug(1, 'id', 'key', {})
    expect(log).not.toHaveBeenCalled()
  })
})
