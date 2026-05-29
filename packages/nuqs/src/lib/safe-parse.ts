import { debugEnabled } from './debug'

export function safeParse<I, R>(
  parser: (arg: I) => R,
  value: I,
  key?: string
): R | null {
  try {
    return parser(value)
  } catch (e) {
    if (debugEnabled) {
      console.warn(
        '[nuqs] Error while parsing value `%s`: %O' +
          (key ? ' (for key `%s`)' : ''),
        value,
        e,
        key
      )
    }
    return null
  }
}
