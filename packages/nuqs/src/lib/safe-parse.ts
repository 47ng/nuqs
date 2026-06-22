import { warn } from './debug'

export function safeParse<I extends { toString(): string }, R>(
  parser: (arg: I) => R,
  value: I,
  key?: string
): R | null {
  try {
    return parser(value)
  } catch (error) {
    // Split per code so each call matches its message's arity exactly (a single
    // `key ? 25 : 24` would widen the argument tuple to a union).
    if (key) {
      warn(25, value, error, key)
    } else {
      warn(24, value, error)
    }
    return null
  }
}
