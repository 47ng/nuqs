// @ts-ignore
import { cache } from 'react'
import type { SearchParams } from './defs'
import { error } from './errors'
import type { ParserBuilder, inferParserType } from './parsers'

const $input: unique symbol = Symbol('Input')

export function createSearchParamsCache<
  Parsers extends Record<string, ParserBuilder<any>>
>(
  parsers: Parsers,
  { urlKeys = {} }: { urlKeys?: Partial<Record<keyof Parsers, string>> } = {}
) {
  type Keys = keyof Parsers
  type ParsedSearchParams = {
    readonly [K in Keys]: inferParserType<Parsers[K]>
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

  function parseSync(searchParams: SearchParams): ParsedSearchParams {
    const c = getCache()
    if (Object.isFrozen(c.searchParams)) {
      // Parse has already been called...
      if (c[$input] && compareSearchParams(searchParams, c[$input])) {
        // ...but we're being called with the same contents again,
        // so we can safely return the same cached result (an example of when
        // this occurs would be if parse was called in generateMetadata as well
        // as the page itself).
        return all()
      }
      // Different inputs in the same request - fail
      throw new Error(error(501))
    }
    for (const key in parsers) {
      const parser = parsers[key]!
      const urlKey = urlKeys[key] ?? key
      c.searchParams[key] = parser.parseServerSide(searchParams[urlKey])
    }
    c[$input] = searchParams
    return Object.freeze(c.searchParams) as ParsedSearchParams
  }

  /**
   * Parse the incoming `searchParams` page prop using the parsers provided,
   * and make it available to the RSC tree.
   *
   * @returns The parsed search params for direct use in the page component.
   *
   * Note: Next.js 15 introduced a breaking change in making their
   * `searchParam` prop a Promise. You will need to await this function
   * to use the Promise version in Next.js 15.
   */
  function parse(searchParams: SearchParams): ParsedSearchParams

  /**
   * Parse the incoming `searchParams` page prop using the parsers provided,
   * and make it available to the RSC tree.
   *
   * @returns The parsed search params for direct use in the page component.
   *
   * Note: this async version requires Next.js 15 or later.
   */
  function parse(searchParams: Promise<any>): Promise<ParsedSearchParams>

  function parse(searchParams: SearchParams | Promise<any>) {
    if (searchParams instanceof Promise) {
      return searchParams.then(parseSync)
    }
    return parseSync(searchParams)
  }
  function all() {
    const { searchParams } = getCache()
    if (Object.keys(searchParams).length === 0) {
      throw new Error(error(500))
    }
    return searchParams as ParsedSearchParams
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

export function compareSearchParams(a: SearchParams, b: SearchParams) {
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
