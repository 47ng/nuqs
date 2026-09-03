import { parseWithClientCache } from './parse-cache.client'
import { safeParse } from './safe-parse'

export function parseWithCache<T>(
  urlKey: string,
  parse: (query: string & Array<string>) => T | null,
  query: string & Array<string>,
  value?: T
): T | null {
  if (typeof window === 'undefined') {
    return safeParse(parse, query, urlKey)
  }
  return parseWithClientCache(urlKey, parse, query, value)
}
