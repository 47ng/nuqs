import { cache } from 'react'
import { error } from './errors'
import type { ParserBuilder } from './parsers'

export type SearchParams = Record<string, string | string[] | undefined>

type ExtractParserType<Parser> = Parser extends ParserBuilder<any>
  ? ReturnType<Parser['parseServerSide']>
  : never

export function createSearchParamCache<
  Parsers extends Record<string, ParserBuilder<any>>
>(parsers: Parsers) {
  type Keys = keyof Parsers
  type ParsedSearchParams = {
    [K in Keys]?: ExtractParserType<Parsers[K]>
  }
  const getCache = cache<() => ParsedSearchParams>(() => ({}))
  function parseSearchParams(searchParams: SearchParams) {
    const c = getCache()
    for (const key in parsers) {
      const parser = parsers[key]!
      c[key] = parser.parseServerSide(searchParams[key])
    }
    return Object.freeze(c)
  }
  function getSearchParam<Key extends keyof Parsers>(
    key: Key
  ): Required<ParsedSearchParams>[Key] {
    const c = getCache()
    const entry = c[key]
    if (typeof entry === 'undefined') {
      throw new Error(
        error(500) +
          `
  in getSearchParam(${String(key)})`
      )
    }
    return entry
  }
  return { parseSearchParams, getSearchParam }
}
