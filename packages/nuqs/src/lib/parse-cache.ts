import {
  cacheParsedValue,
  clearParseCache,
  getParseCacheVersion,
  parseWithClientCache,
  retainParseCache
} from './parse-cache.client'
import { safeParse } from './safe-parse'

export {
  cacheParsedValue,
  clearParseCache,
  getParseCacheVersion,
  retainParseCache
}

export function parseWithCache<T>(
  urlKey: string,
  parse: (query: string & Array<string>) => T | null,
  query: string & Array<string>
): T | null {
  if (typeof window === 'undefined') {
    // A module-scoped cache on the server would be shared across requests.
    return safeParse(parse, query, urlKey)
  }
  return parseWithClientCache(urlKey, parse, query)
}
