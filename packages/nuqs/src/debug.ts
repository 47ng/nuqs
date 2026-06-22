import { isDebugEnabled, setDebugSink } from './lib/debug'
import { debugMessages, sprintf } from './lib/debug-messages'

/**
 * Opt nuqs debug logging into the (client) bundle.
 *
 * Logging is gated out of the client bundle by default to keep it lean.
 * Importing `nuqs/debug` loads the log messages; the bare import respects the
 * `debug=nuqs` key in localStorage — set it and reload, as before. Calling this
 * function directly installs the logging sink unconditionally (bypassing the
 * flag), to turn logging on programmatically.
 *
 * Server-side, logging is wired in automatically by `nuqs/server` and gated by
 * the `DEBUG=nuqs` environment variable (the server bundle has more size
 * headroom), so you don't need this entry there.
 *
 * @example
 * ```ts
 * // Opt in once, anywhere in your app:
 * import 'nuqs/debug'
 * // then, from the browser console:
 * localStorage.debug = 'nuqs' // and reload
 * ```
 */
export function enableNuqsDebugging(): void {
  setDebugSink((code, args, isWarn) => {
    // Annotated as possibly-undefined so the guard below survives a runtime code
    // that isn't in the catalog (call sites are type-checked, but be defensive).
    const message: string | undefined = debugMessages[code]
    if (message === undefined) {
      return
    }
    if (isWarn) {
      console.warn(message, ...args)
      return
    }
    const formatted = sprintf(message, ...args)
    performance.mark(formatted)
    try {
      // Handle React Devtools not being able to console.log('%s', null)
      console.log(message, ...args)
    } catch {
      console.log(formatted)
    }
  })
}

/**
 * Turn nuqs debug logging back off (removes the logging sink).
 */
export function disableNuqsDebugging(): void {
  setDebugSink(null)
}

// Respect the existing localStorage/DEBUG flag as soon as this entry loads, so
// `import 'nuqs/debug'` is all that's needed to turn logging on.
if (isDebugEnabled()) {
  enableNuqsDebugging()
}
