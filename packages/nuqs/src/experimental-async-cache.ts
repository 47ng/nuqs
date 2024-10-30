// @ts-ignore
import { cache } from 'react'
import type { SearchParams } from './defs'
import { error } from './errors'
import type { ParserBuilder, inferParserType } from './parsers'

const $input: unique symbol = Symbol('Promise<searchParams>')
const $ready: unique symbol = Symbol('ready')
const $awaited: unique symbol = Symbol('searchParams')

export function experimental_createAsyncSearchParamsCache<
  Parsers extends Record<string, ParserBuilder<any>>
>(parsers: Parsers) {
  type Keys = keyof Parsers
  type ParsedSearchParams = {
    readonly [K in Keys]: inferParserType<Parsers[K]>
  }

  type Cache = {
    searchParams: Partial<ParsedSearchParams>
    [$input]?: Promise<SearchParams>
    [$awaited]?: SearchParams
    [$ready]?: Promise<void>
    markAsReady?: () => void
  }

  // Why not use a good old object here ?
  // React's `cache` is bound to the render lifecycle of a page,
  // whereas a simple object would be bound to the lifecycle of the process,
  // which may be reused between requests in a serverless environment
  // (warm lambdas on Vercel or AWS).
  const getCache = cache<() => Cache>(() => ({
    searchParams: {}
  }))

  async function awaitAndLoad(
    searchParams: SearchParams,
    promise: Promise<SearchParams>
  ): Promise<ParsedSearchParams> {
    const c = getCache()
    if (Object.isFrozen(c.searchParams)) {
      // Parse has already been called...
      if (c[$awaited] && compareSearchParams(searchParams, c[$awaited])) {
        // ...but we're being called with the same contents again,
        // so we can safely return the same cached result (an example of when
        // this occurs would be if load was called in generateMetadata as well
        // as the page itself).
        return all()
      }
      // Different inputs in the same request - fail
      throw new Error(error(501))
    }
    for (const key in parsers) {
      const parser = parsers[key]!
      c.searchParams[key] = parser.parseServerSide(searchParams[key])
    }
    c[$input] = promise
    try {
      return Object.freeze(c.searchParams) as ParsedSearchParams
    } finally {
      c.markAsReady!()
    }
  }

  /**
   * Load the incoming `searchParams` page prop using the parsers provided,
   * and make it available to the RSC tree.
   *
   * @returns A Promise of the parsed search params for direct use in the page component.
   */
  function load(
    searchParamsPromise: Promise<SearchParams>
  ): Promise<ParsedSearchParams> {
    if (!(searchParamsPromise instanceof Promise)) {
      throw new Error(
        'nuqs: experimental async cache requires a Promise for the searchParams page prop.'
      )
    }
    const c = getCache()
    const { promise, resolve } = Promise.withResolvers<void>()
    c.markAsReady = resolve
    c[$ready] = promise
    return searchParamsPromise.then(searchParams =>
      awaitAndLoad(searchParams, searchParamsPromise)
    )
  }
  async function all(): Promise<ParsedSearchParams> {
    const { searchParams, [$ready]: ready } = getCache()
    await ready
    if (Object.keys(searchParams).length === 0) {
      throw new Error(error(500))
    }
    return searchParams as ParsedSearchParams
  }
  async function get<Key extends Keys>(
    key: Key
  ): Promise<ParsedSearchParams[Key]> {
    const { searchParams, [$ready]: ready } = getCache()
    await ready
    const entry = searchParams[key]
    if (typeof entry === 'undefined') {
      throw new Error(
        error(500) +
          `
  in get(${String(key)})`
      )
    }
    return entry
  }
  return { load, get, all }
}

function compareSearchParams(a: SearchParams, b: SearchParams) {
  if (a === b) {
    return true
  }
  if (Object.keys(a).length !== Object.keys(b).length) {
    return false
  }
  for (const key in a) {
    if (a[key] !== b[key]) {
      return false
    }
  }
  return true
}
