import type { Query } from './search-params'

// Replaces inline `(a, b) => a === b` calls for bundle size reduction.
export function isEqual(a: unknown, b: unknown): boolean {
  return a === b
}

export function compareArrays<T>(
  a: T[],
  b: T[],
  eq: (a: T, b: T) => boolean
): boolean {
  return (
    a === b ||
    (a.length === b.length && a.every((value, index) => eq(value, b[index]!)))
  )
}

export function compareQuery<T extends Query>(
  a: T | null,
  b: T | null
): boolean {
  return (
    a === b ||
    (Array.isArray(a) &&
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((value, index) => value === b[index]!))
  )
}
