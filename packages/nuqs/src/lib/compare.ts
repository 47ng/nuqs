export function compareQuery<T extends string | Iterable<string>>(
  a: T | null,
  b: T | null
): boolean {
  if (a === b) {
    return true // Referentially stable
  }
  if (a === null || b === null) {
    return false
  }
  // we expect either strings or iterables, not a mix of both
  if (typeof a === 'string' || typeof b === 'string') {
    return false
  }

  const iterA = a[Symbol.iterator]()
  const iterB = b[Symbol.iterator]()

  while (true) {
    const nextA = iterA.next()
    const nextB = iterB.next()

    if (nextA.done && nextB.done) {
      return true // both ended at the same time
    }
    if (nextA.done !== nextB.done) {
      return false // different lengths
    }
    if (nextA.value !== nextB.value) {
      return false // mismatched value
    }
  }
}
