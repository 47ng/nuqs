const FUNCTION_MARKER = '[Function]'

/**
 * Snapshot a debug argument into an immutable, inspectable value.
 *
 * Runs in the sink right before emit (never on the hot path when no sink is
 * attached). nuqs mutates queues and `URLSearchParams` in place, so cloning is
 * what keeps the log history from rewriting itself. Built-ins we care about
 * (`URL`, `URLSearchParams`, `Error`, `Date`, `Map`, `Set`) keep their type so
 * the panel can render them with dedicated inspectors; functions collapse to a
 * presence marker (we log *that* an option is set, not its body); cycles are
 * guarded, and anything that resists cloning falls back to a string.
 */
export function normalize(value: unknown): unknown {
  try {
    return clone(value, new WeakMap())
  } catch {
    try {
      return String(value)
    } catch {
      return '[Unserializable]'
    }
  }
}

function clone(value: unknown, seen: WeakMap<object, unknown>): unknown {
  if (typeof value === 'function') {
    return FUNCTION_MARKER
  }
  if (value === null || typeof value !== 'object') {
    return value
  }
  // Type-preserving clones for the inspectable built-ins we log.
  if (value instanceof URLSearchParams) return new URLSearchParams(value)
  if (value instanceof URL) return new URL(value.href)
  if (value instanceof Date) return new Date(value.getTime())
  // Errors are immutable in practice; keep the reference so `instanceof` holds.
  if (value instanceof Error) return value
  const cached = seen.get(value)
  if (cached !== undefined) {
    return cached
  }
  if (Array.isArray(value)) {
    const out: unknown[] = []
    seen.set(value, out)
    for (const item of value) out.push(clone(item, seen))
    return out
  }
  if (value instanceof Map) {
    const out = new Map<unknown, unknown>()
    seen.set(value, out)
    for (const [k, v] of value) out.set(k, clone(v, seen))
    return out
  }
  if (value instanceof Set) {
    const out = new Set<unknown>()
    seen.set(value, out)
    for (const v of value) out.add(clone(v, seen))
    return out
  }
  // Plain object or unknown class instance: copy own enumerable props, dropping
  // the prototype (methods are non-enumerable, so they fall away here).
  const out: Record<string, unknown> = {}
  seen.set(value, out)
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = clone(v, seen)
  }
  return out
}
