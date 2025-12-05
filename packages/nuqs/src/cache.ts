import * as React from 'react'
import type { SearchParams, UrlKeys } from './defs'
import { error } from './lib/errors'
import { createLoader, type LoaderFunctionOptions } from './loader'
import type { inferParserType, ParserMap } from './parsers'

const $input: unique symbol = Symbol('Input')

type CacheInterface<Parsers extends ParserMap> = {
  parse: {
    /**
     * Parse the incoming `searchParams` page prop using the parsers provided,
     * and make it available to the RSC tree.
     *
     * @argument searchParams - The `searchParams` prop from the page component.
     * @argument loaderOptions.strict - When `true`, the loader will throw an error
     *  if a search params value is invalid for the given parser, rather than falling
     * back to the parser's default value (or `null` if no default is set).
     *
     * @returns The parsed search params for direct use in the page component.
     *
     * Note: Next.js 15 introduced a breaking change in making their
     * `searchParam` prop a Promise. You will need to await this function
     * to use the Promise version in Next.js 15.
     */
    (
      searchParams: SearchParams,
      loaderOptions?: LoaderFunctionOptions
    ): inferParserType<Parsers>

    /**
     * Parse the incoming `searchParams` page prop using the parsers provided,
     * and make it available to the RSC tree.
     *
     * @argument searchParams - The `searchParams` prop from the page component (Promise).
     * @argument loaderOptions.strict - When `true`, the Promise returned from the loader
     * will reject if a search params value is invalid for the given parser,
     * rather than falling back to the parser's default value (or `null` if no default is set).
     *
     * @returns The parsed search params for direct use in the page component.
     *
     * Note: this async version requires Next.js 15 or later.
     */
    (
      searchParams: Promise<any>,
      loaderOptions?: LoaderFunctionOptions
    ): Promise<inferParserType<Parsers>>
  }
  all: () => inferParserType<Parsers>
  get: <Key extends keyof Parsers>(key: Key) => inferParserType<Parsers[Key]>
}

export function createSearchParamsCache<Parsers extends ParserMap>(
  parsers: Parsers,
  { urlKeys = {} }: { urlKeys?: UrlKeys<Parsers> } = {}
): CacheInterface<Parsers> {
  const load = createLoader(parsers, { urlKeys })
  type Keys = keyof Parsers
  type ParsedSearchParams = inferParserType<Parsers>

  type Cache = {
    searchParams: Partial<ParsedSearchParams>
    [$input]?: SearchParams
  }

  // Why not use a good old object here ?
  // React's `cache` is bound to the render lifecycle of a page,
  // whereas a simple object would be bound to the lifecycle of the process,
  // which may be reused between requests in a serverless environment
  // (warm lambdas on Vercel or AWS).
  const getCache = React.cache<() => Cache>(() => ({
    searchParams: {}
  }))

  function parseSync(
    searchParams: SearchParams,
    loaderOptions: LoaderFunctionOptions
  ): ParsedSearchParams {
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
    c.searchParams = load(searchParams, loaderOptions)
    c[$input] = searchParams
    return Object.freeze(c.searchParams) as ParsedSearchParams
  }

  function parse(
    searchParams: SearchParams,
    loaderOptions?: LoaderFunctionOptions
  ): ParsedSearchParams
  function parse(
    searchParams: Promise<any>,
    loaderOptions?: LoaderFunctionOptions
  ): Promise<ParsedSearchParams>
  function parse(
    searchParams: SearchParams | Promise<any>,
    loaderOptions: LoaderFunctionOptions = {}
  ) {
    if (searchParams instanceof Promise) {
      return searchParams.then(searchParams =>
        parseSync(searchParams, loaderOptions)
      )
    }
    return parseSync(searchParams, loaderOptions)
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

export function compareSearchParams(a: SearchParams, b: SearchParams): boolean {
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
