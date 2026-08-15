import { compareQuery } from './compare'
import { warn } from './debug'
import type { Query } from './search-params'

type ParseFunction = (query: string & Array<string>) => unknown

type ParseCacheEntry = [
  parse: ParseFunction,
  query: Query,
  value: unknown,
  error?: unknown
]

type ParseCacheBucket = {
  entry?: ParseCacheEntry
  version: number
  retained: number
}

const parseCache = new Map<string, ParseCacheBucket>()
const maxParseCacheSize = 1000

function getParseCacheBucket(urlKey: string): ParseCacheBucket {
  let bucket = parseCache.get(urlKey)
  if (!bucket) {
    if (parseCache.size >= maxParseCacheSize) {
      for (const [key, candidate] of parseCache) {
        if (!candidate.retained) {
          parseCache.delete(key)
          break
        }
      }
    }
    bucket = { version: 0, retained: 0 }
    parseCache.set(urlKey, bucket)
  }
  return bucket
}

export function clearParseCache(): void {
  for (const bucket of parseCache.values()) {
    bucket.entry = undefined
  }
}

export function retainParseCache(urlKey: string, delta: 1 | -1): void {
  const bucket = getParseCacheBucket(urlKey)
  bucket.retained += delta
  if (!bucket.retained && parseCache.size > maxParseCacheSize) {
    parseCache.delete(urlKey)
  }
}

export function cacheParsedValue<T>(
  urlKey: string,
  parse: (query: string & Array<string>) => T | null,
  query: string & Array<string>,
  value: T
): void {
  if (typeof window !== 'undefined') {
    const cached = parseCache.get(urlKey)?.entry
    if (
      cached &&
      cached[0] === parse &&
      compareQuery(cached[1], query) &&
      Object.is(cached[2], value)
    ) {
      return
    }
    const bucket = getParseCacheBucket(urlKey)
    bucket.entry = [parse, query, value]
    bucket.version++
  }
}

export function getParseCacheVersion(urlKey: string): number {
  return parseCache.get(urlKey)?.version ?? 0
}

export function parseWithClientCache<T>(
  urlKey: string,
  parse: (query: string & Array<string>) => T | null,
  query: string & Array<string>
): T | null {
  const cached = parseCache.get(urlKey)?.entry
  if (cached?.[0] === parse && compareQuery(cached[1], query)) {
    if (cached[3] !== undefined) {
      warn(25, query, cached[3], urlKey)
    }
    return cached[2] as T | null
  }
  const entry: ParseCacheEntry = [parse, query, null]
  try {
    entry[2] = parse(query)
  } catch (error) {
    warn(25, query, error, urlKey)
    entry[3] = error
  }
  getParseCacheBucket(urlKey).entry = entry
  return entry[2] as T | null
}
