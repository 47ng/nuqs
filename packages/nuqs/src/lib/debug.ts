// Type-only import: erased at build time (verbatimModuleSyntax), so the message
// catalog's *types* constrain the call sites here while its *values* stay out of
// the core bundle (they only ship via the opt-in `nuqs/debug` entry).
import type { DebugArgs, DebugCode } from './debug-messages'

export type DebugSink = (
  code: DebugCode,
  args: unknown[],
  isWarn?: boolean
) => void

let sink: DebugSink | null = null

/**
 * Install (or remove, with `null`) the function that renders debug logs.
 *
 * The core bundle only carries this thin dispatcher and the numeric message
 * codes passed to `debug`/`warn`. The format strings and formatting logic live
 * in the `nuqs/debug` entry point, which calls this to opt logging into the
 * bundle at runtime (gated by the `debug=nuqs`/`DEBUG=nuqs` flag).
 */
export function setDebugSink(newSink: DebugSink | null): void {
  sink = newSink
}

export function debug<Code extends DebugCode>(
  code: Code,
  ...args: DebugArgs<Code>
): void {
  sink?.(code, args)
}

export function warn<Code extends DebugCode>(
  code: Code,
  ...args: DebugArgs<Code>
): void {
  sink?.(code, args, true)
}

export function isDebugFlagSet(): boolean {
  // Issue: https://github.com/47ng/nuqs/issues/1336
  // Backend (Node/server): use DEBUG env var, never touch localStorage.
  // --localstorage-file triggers a warning.
  if (typeof window === 'undefined') {
    return (process.env.DEBUG || '').includes('nuqs')
  }

  // Check if localStorage is available.
  // It may be unavailable in some environments,
  // like Safari in private browsing mode.
  // See https://github.com/47ng/nuqs/pull/588
  try {
    const test = 'nuqs-localStorage-test'
    if (typeof localStorage === 'undefined') {
      return false
    }
    localStorage.setItem(test, test)
    const isStorageAvailable = localStorage.getItem(test) === test
    localStorage.removeItem(test)
    return (
      isStorageAvailable &&
      (localStorage.getItem('debug') || '').includes('nuqs')
    )
  } catch {
    return false
  }
}
