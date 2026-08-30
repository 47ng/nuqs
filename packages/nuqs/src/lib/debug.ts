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

export function warn<Code extends 24 | 25>(
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
    return (
      typeof process !== 'undefined' &&
      (process.env.DEBUG || '').includes('nuqs')
    )
  }

  // Accessing or writing to localStorage may throw, notably in Safari private
  // browsing mode, so keep the complete availability check inside this try.
  // See https://github.com/47ng/nuqs/pull/588
  try {
    const test = 'nuqs-localStorage-test'
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
