import { compareQuery } from './compare'
import { debug } from './debug'
import type { Query } from './search-params'

type ParseFunction = (query: string & Array<string>) => unknown

type ParseCacheEntry = [
  parse: ParseFunction,
  query: Query,
  value: unknown,
  error?: unknown
]

type ParseCacheBucket = {
  e?: ParseCacheEntry
  v?: number
  r: number
}

const parseCache = new Map<string, ParseCacheBucket>()

function getParseCacheBucket(urlKey: string): ParseCacheBucket {
  let bucket = parseCache.get(urlKey)
  if (!bucket) {
    if (parseCache.size >= 1e3) {
      for (const [key, candidate] of parseCache) {
        if (!candidate.r) {
          parseCache.delete(key)
          break
        }
      }
    }
    parseCache.set(urlKey, (bucket = { r: 0 }))
  }
  return bucket
}

export function clearParseCache(): void {
  parseCache.forEach(bucket => (bucket.e = undefined))
}

export function retainParseCache(urlKey: string, delta: 1 | -1): void {
  const bucket = getParseCacheBucket(urlKey)
  if (!(bucket.r += delta) && parseCache.size > 1e3) {
    parseCache.delete(urlKey)
  }
}

export function getParseCacheVersion(urlKey: string): number | undefined {
  return parseCache.get(urlKey)?.v
}

export function parseWithClientCache<T>(
  urlKey: string,
  parse: (query: string & Array<string>) => T | null,
  query: string & Array<string>,
  value?: T
): T | null {
  const cached = parseCache.get(urlKey)?.e
  if (value !== undefined) {
    if (
      cached?.[0] === parse &&
      compareQuery(cached[1], query) &&
      Object.is(cached[2], value)
    ) {
      return value
    }
    const bucket = getParseCacheBucket(urlKey)
    bucket.e = [parse, query, value]
    bucket.v = (bucket.v ?? -1) + 1
    return value
  }
  if (cached?.[0] === parse && compareQuery(cached[1], query)) {
    if (cached[3] !== undefined) {
      debug(25, query, cached[3], urlKey)
    }
    return cached[2] as T | null
  }
  const entry: ParseCacheEntry = [parse, query, null]
  try {
    entry[2] = parse(query)
  } catch (error) {
    debug(25, query, error, urlKey)
    entry[3] = error
  }
  getParseCacheBucket(urlKey).e = entry
  return entry[2] as T | null
}
