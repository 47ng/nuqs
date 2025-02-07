import type { Parser } from '../parsers'
import { warn } from './debug'

export function safeParse<T>(
  parser: Parser<T>['parse'],
  value: string,
  key?: string
) {
  try {
    return parser(value)
  } catch (error) {
    warn(
      '[nuqs] Error while parsing value `%s`: %O' +
        (key ? ' (for key `%s`)' : ''),
      value,
      error,
      key
    )
    return null
  }
}
