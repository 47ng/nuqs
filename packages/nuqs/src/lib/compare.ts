import type { QueryParam } from './search-params'

export function compareQuery<T extends QueryParam>(
  a: T | null,
  b: T | null
): boolean {
  if (a === b) {
    return true // Referentially stable
  }
  if (a === null || b === null) {
    return false
  }
  // we expect either strings or arrays, not a mix of both
  if (typeof a === 'string' || typeof b === 'string') {
    return false
  }

  if (a.length !== b.length) {
    return false
  }

  return a.every((value, index) => value === b[index]!)
}
