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

describe('debug message catalog', () => {
  // Call sites pass a bare numeric code (`debug(4, …)`), so the code→message
  // mapping is the contract. Codes with identical argument shapes — e.g. 4/5
  // (Subscribing/Unsubscribing) or 2/3 — are otherwise indistinguishable to the
  // type checker, so a renumber, reorder or copy-paste would compile cleanly
  // while logging the wrong thing. This snapshot pins the catalog so any such
  // drift surfaces as a failing test.
  it('maps each code to its message', () => {
    expect(debugMessages).toMatchInlineSnapshot(`
      {
        "1": "[nuq+ %s \`%s\`] State changed: %O",
        "10": "[nuqs gtq] Resetting queue %s",
        "11": "[nuqs gtq] Applying %d pending update(s) on top of %s",
        "12": "[nuqs gtq] Flushing queue %O with options %O",
        "13": "[nuqs dq] Flushing debounce queue %O",
        "14": "[nuqs dq] Reset debounce queue %O",
        "15": "[nuqs dqc] Creating debounce queue for \`%s\`",
        "16": "[nuqs dqc] Cleaning up empty queue for \`%s\`",
        "17": "[nuqs dqc] Enqueueing debounce update %O",
        "18": "[nuqs dqc] Aborting debounce queue %s=%s",
        "19": "[nuqs] Aborting queues",
        "2": "[nuq+ %s \`%s\`] Cross-hook key sync %s: %O (default: %O). no change, skipping, resolved: %O",
        "20": "[nuqs %s] Updating url: %s",
        "21": "[nuqs %s] Patching history (%s adapter)",
        "22": "[nuqs \`%s\`] no change, returning previous: %O",
        "23": "[nuqs \`%s\`] subbed search params change
        from %O
        to   %O",
        "24": "[nuqs] Error while parsing value \`%s\`: %O",
        "25": "[nuqs] Error while parsing value \`%s\`: %O (for key \`%s\`)",
        "3": "[nuq+ %s \`%s\`] Cross-hook key sync %s: %O (default: %O). updateInternalState, resolved: %O",
        "4": "[nuq+ %s \`%s\`] Subscribing to sync for \`%s\`",
        "5": "[nuq+ %s \`%s\`] Unsubscribing to sync for \`%s\`",
        "6": "[nuq+ %s \`%s\`] setState: %O",
        "7": "[nuqs gtq] Enqueueing %s=%s %O",
        "8": "[nuqs gtq] Skipping flush due to throttleMs=Infinity",
        "9": "[nuqs gtq] Scheduling flush in %f ms. Throttled at %f ms (x%f)",
      }
    `)
  })
})
