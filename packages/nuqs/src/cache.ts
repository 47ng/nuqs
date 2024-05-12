import { cache } from 'react'
import { error } from './errors'
import type { ParserBuilder } from './parsers'

export type SearchParams = Record<string, string | string[] | undefined>

const $input: unique symbol = Symbol('Input')

type ExtractParserType<Parser> =
  Parser extends ParserBuilder<any>
    ? ReturnType<Parser['parseServerSide']>
    : never

export function createSearchParamsCache<
  Parsers extends Record<string, ParserBuilder<any>>
>(parsers: Parsers) {
  type Keys = keyof Parsers
  type ParsedSearchParams = {
    [K in Keys]: ExtractParserType<Parsers[K]>
  }

  type Cache = {
    searchParams: Partial<ParsedSearchParams>
    [$input]?: SearchParams
  }

  // Why not use a good old object here ?
  // React's `cache` is bound to the render lifecycle of a page,
  // whereas a simple object would be bound to the lifecycle of the process,
  // which may be reused between requests in a serverless environment
  // (warm lambdas on Vercel or AWS).
  const getCache = cache<() => Cache>(() => ({
    searchParams: {}
  }))
  function parse(searchParams: SearchParams) {
    const c = getCache()

    if (Object.isFrozen(c)) {
      // parse has already been called
      if (searchParams === c[$input]) {
        // but we're being called with the identical object again, so we can safely return the same cached result
        // (an example of when this occurs would be if parse was called in generateMetadata as well as the page itself).
        // note that this simply checks for referential equality and will still fail if a different object with the
        // same contents is passed. fortunately next.js uses the same object for search params in the same request.
        return all()
      }

      // different input in the same request - fail
      throw new Error(error(501))
    }

    for (const key in parsers) {
      const parser = parsers[key]!
      c.searchParams[key] = parser.parseServerSide(searchParams[key])
    }

    c[$input] = searchParams
    Object.freeze(c)

    return c.searchParams as Readonly<ParsedSearchParams>
  }
  function all() {
    const { searchParams } = getCache()
    if (Object.keys(searchParams).length === 0) {
      throw new Error(error(500))
    }
    return searchParams as Readonly<ParsedSearchParams>
  }
  function get<Key extends Keys>(key: Key): ParsedSearchParams[Key] {
    const { searchParams } = getCache()
    const entry = searchParams[key]
    if (typeof entry === 'undefined') {
      throw new Error(
        error(500) +
          `
  in get(${String(key)})`
      )
    }
    // @ts-ignore
    return entry
  }
  return { parse, get, all }
}
