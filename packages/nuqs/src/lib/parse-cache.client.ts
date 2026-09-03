import { compareQuery } from './compare'
import { warn } from './debug'
import { globalSingleton } from './global-singleton'
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
  p?: ParseCacheEntry
  v?: number
  r: number
}

type ParseCacheMap = Map<string, ParseCacheBucket> & {
  // The shared map tracks the latest version issued, not each evictable bucket.
  // It never reuses one after recreation, so detached consumers see new publications.
  v?: number
}

const parseCache = globalSingleton<ParseCacheMap>(
  'parse-cache',
  () => new Map<string, ParseCacheBucket>()
)

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

function holdsValue(
  entry: ParseCacheEntry | undefined,
  parse: ParseFunction,
  query: Query,
  value: unknown
): boolean {
  return (
    entry?.[0] === parse &&
    compareQuery(entry[1], query) &&
    Object.is(entry[2], value)
  )
}

function clearBucket(bucket: ParseCacheBucket): void {
  bucket.e = bucket.p = bucket.v = undefined
}

export function clearParseCache(): void {
  parseCache.forEach(clearBucket)
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

export function clearParseCacheKey(urlKey: string): void {
  const bucket = parseCache.get(urlKey)
  if (bucket) {
    clearBucket(bucket)
  }
}

export function parseWithClientCache<T>(
  urlKey: string,
  parse: (query: string & Array<string>) => T | null,
  query: string & Array<string>,
  value?: T
): T | null {
  const bucket = getParseCacheBucket(urlKey)
  const cached = bucket.e
  const published = bucket.p
  if (value !== undefined) {
    // `e` holds the latest parse result from any parser.
    // Another parser's read can replace `e`, leaving `p` as our last published write.
    // We check both so writing that value again does not bump the version.
    if (
      holdsValue(cached, parse, query, value) ||
      holdsValue(published, parse, query, value)
    ) {
      return value
    }
    bucket.e = bucket.p = [parse, query, value]
    bucket.v = parseCache.v = (parseCache.v ?? 0) + 1
    return value
  }
  if (published) {
    if (!compareQuery(published[1], query)) {
      bucket.p = undefined
    } else if (published[0] === parse) {
      return published[2] as T | null
    }
  }
  let entry = cached
  if (entry?.[0] !== parse || !compareQuery(entry[1], query)) {
    entry = [parse, query, null]
    try {
      entry[2] = parse(query)
    } catch (error) {
      entry[3] = error
    }
    bucket.e = entry
  }
  if (entry[3] !== undefined) {
    warn(25, query, entry[3], urlKey)
  }
  return entry[2] as T | null
}
