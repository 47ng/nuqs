import type { Query } from './search-params'

export function compareQuery<T extends Query>(
  a: T | null,
  b: T | null
): boolean {
  return (
    a === b ||
    (a !== null &&
      b !== null &&
      typeof a !== 'string' &&
      typeof b !== 'string' &&
      a.length === b.length &&
      a.every((v, i) => v === b[i]!))
  )
}
