import { compareQuery } from './compare'
import { safeParse } from './safe-parse'
import type { Query } from './search-params'

type ParseFunction = (query: string & Array<string>) => unknown

type ParseCacheEntry = {
  parse: ParseFunction
  query: Query
  value: unknown
}

// One entry per url key: parsing the same raw query with the same parser
// yields one referentially-stable value shared by all consumers of that key.
// A different parser bound to the same key (double-bind) misses gracefully
// and re-parses with its own parser.
const parseCache = new Map<string, ParseCacheEntry>()

// Bounds memory for high-cardinality keys (e.g. `?row_<id>=`) across
// long-lived sessions.
const maxParseCacheSize = 1000

// The testing adapter clears the cache alongside the update queues,
// to isolate tests from each other.
export function clearParseCache(): void {
  parseCache.clear()
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
  const cached = parseCache.get(urlKey)
  if (cached && cached.parse === parse && compareQuery(cached.query, query)) {
    return cached.value as T | null
  }
  const value = safeParse(parse, query, urlKey)
  if (parseCache.size >= maxParseCacheSize) {
    parseCache.delete(parseCache.keys().next().value!)
  }
  parseCache.set(urlKey, { parse: parse as ParseFunction, query, value })
  return value
}
