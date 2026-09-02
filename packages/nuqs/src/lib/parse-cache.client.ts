import { compareQuery } from './compare'
import { warn } from './debug'
import type { Query } from './search-params'

type ParseFunction = (query: string & Array<string>) => unknown

type ParseCacheEntry = {
  parse: ParseFunction
  query: Query
  value: unknown
  error?: unknown
}

const parseCache = new Map<string, ParseCacheEntry>()
const maxParseCacheSize = 1000

export function clearParseCache(): void {
  parseCache.clear()
}

export function parseWithClientCache<T>(
  urlKey: string,
  parse: (query: string & Array<string>) => T | null,
  query: string & Array<string>
): T | null {
  const cached = parseCache.get(urlKey)
  if (cached && cached.parse === parse && compareQuery(cached.query, query)) {
    if (cached.error !== undefined) {
      warn(25, query, cached.error, urlKey)
    }
    return cached.value as T | null
  }
  const entry: ParseCacheEntry = { parse, query, value: null }
  try {
    entry.value = parse(query)
  } catch (error) {
    warn(25, query, error, urlKey)
    entry.error = error
  }
  if (!parseCache.has(urlKey) && parseCache.size >= maxParseCacheSize) {
    parseCache.delete(parseCache.keys().next().value!)
  }
  parseCache.set(urlKey, entry)
  return entry.value as T | null
}
