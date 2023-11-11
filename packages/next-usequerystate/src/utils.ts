import { warn } from './debug'
import type { Parser } from './parsers'

export function safeParse<T>(parser: Parser<T>['parse'], value: string) {
  try {
    return parser(value)
  } catch (error) {
    warn('[nuqs] Error while parsing value `%s`: %O', error)
    return null
  }
}
