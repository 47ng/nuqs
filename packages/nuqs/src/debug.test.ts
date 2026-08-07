import { afterEach, describe, expect, it, vi } from 'vitest'
import { debugMessages } from './lib/debug-messages'

// `nuqs/debug` is a side-effect-only entry: importing it installs the logging
// sink when the `DEBUG`/`localStorage.debug` flag is set. Load a fresh module
// graph each time and grab `debug`/`warn` from the same `lib/debug` instance the
// entry wired its sink onto. `flag` toggles the server-side `DEBUG=nuqs` gate the
// entry reads on load.
async function loadDebugEntry({ flag }: { flag: boolean }) {
  vi.resetModules()
  if (flag) {
    vi.stubEnv('DEBUG', 'nuqs')
  }
  await import('./debug')
  return import('./lib/debug')
}

describe('nuqs/debug opt-in', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('debug/warn stay silent when the flag is not set', async () => {
    const { debug, warn } = await loadDebugEntry({ flag: false })
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const wrn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    debug(1, 'id', 'key', {})
    warn(24, 'value', new Error('boom'))
    expect(log).not.toHaveBeenCalled()
    expect(wrn).not.toHaveBeenCalled()
  })

  it('logs to the console when importing nuqs/debug with the flag set', async () => {
    const { debug } = await loadDebugEntry({ flag: true })
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    const args = ['id', 'key', { a: 1 }] as const
    debug(6, ...args)
    expect(log).toHaveBeenCalledExactlyOnceWith(debugMessages[6], ...args)
  })

  it('routes warn through console.warn with the catalog message', async () => {
    const { warn } = await loadDebugEntry({ flag: true })
    const wrn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const cause = new Error('boom')
    warn(24, 'value', cause)
    expect(wrn).toHaveBeenCalledExactlyOnceWith(
      debugMessages[24],
      'value',
      cause
    )
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
