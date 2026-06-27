// Type-only import: erased at build time (verbatimModuleSyntax), so the message
// catalog's *types* constrain the call sites here while its *values* stay out of
// the core bundle (they only ship via the opt-in `nuqs/debug` entry).
import type { DebugArgs, DebugCode } from './debug-messages'

export type DebugSink = (
  code: DebugCode,
  args: unknown[],
  isWarn?: boolean
) => void

const sinks = new Set<DebugSink>()

/**
 * Register a function that renders debug logs. Returns a remover.
 *
 * Multiple sinks can be active at once: the console logger from `nuqs/debug`
 * and the TanStack Devtools bridge from `nuqs/devtools` register independently.
 */
export function addDebugSink(sink: DebugSink): () => void {
  sinks.add(sink)
  return () => {
    sinks.delete(sink)
  }
}

export function debug<Code extends DebugCode>(
  code: Code,
  ...args: DebugArgs<Code>
): void {
  // Fast path when no sink is attached (the 99% case): never touch the args.
  if (sinks.size === 0) {
    return
  }
  for (const sink of sinks) {
    sink(code, args)
  }
}

export function warn<Code extends DebugCode>(
  code: Code,
  ...args: DebugArgs<Code>
): void {
  if (sinks.size === 0) {
    return
  }
  for (const sink of sinks) {
    sink(code, args, true)
  }
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
