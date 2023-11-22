import { cache } from 'react'
import { error } from './errors'
import type { ParserBuilder } from './parsers'

export type SearchParams = Record<string, string | string[] | undefined>

type ExtractParserType<Parser> = Parser extends ParserBuilder<any>
  ? ReturnType<Parser['parseServerSide']>
  : never

export function createSearchParamsCache<
  Parsers extends Record<string, ParserBuilder<any>>
>(parsers: Parsers) {
  type Keys = keyof Parsers
  type ParsedSearchParams = {
    [K in Keys]: ExtractParserType<Parsers[K]>
  }
  // Why not use a good old object here ?
  // React's `cache` is bound to the render lifecycle of a page,
  // whereas a simple object would be bound to the lifecycle of the process,
  // which may be reused between requests in a serverless environment
  // (warm lambdas on Vercel or AWS).
  const getCache = cache<() => Partial<ParsedSearchParams>>(() => ({}))
  function parse(searchParams: SearchParams) {
    const c = getCache()
    if (Object.isFrozen(c)) {
      throw new Error(error(501))
    }
    for (const key in parsers) {
      const parser = parsers[key]!
      c[key] = parser.parseServerSide(searchParams[key])
    }
    return Object.freeze(c) as Readonly<ParsedSearchParams>
  }
  function all() {
    const c = getCache()
    if (Object.keys(c).length === 0) {
      throw new Error(error(500))
    }
    return c as Readonly<ParsedSearchParams>
  }
  function get<Key extends keyof Parsers>(key: Key): ParsedSearchParams[Key] {
    const c = getCache()
    const entry = c[key]
    if (typeof entry === 'undefined') {
      throw new Error(
        error(500) +
          `
  in get(${String(key)})`
      )
    }
    return entry
  }
  return { parse, get, all }
}
