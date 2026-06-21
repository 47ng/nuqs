import { warn } from './debug'

export function safeParse<I, R>(
  parser: (arg: I) => R,
  value: I,
  key?: string
): R | null {
  try {
    return parser(value)
  } catch (error) {
    warn(key ? 25 : 24, value, error, key)
    return null
  }
}
