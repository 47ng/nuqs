import type { Nullable, Options, UrlKeys } from './defs'
import { write } from './lib/search-params'
import { renderQueryString } from './lib/url-encoding'
import { getUrlKey } from './lib/url-keys'
import type { inferParserType, ParserMap } from './parsers'

type Base = string | URLSearchParams | URL

export type CreateSerializerOptions<Parsers extends ParserMap> = Pick<
  Options,
  'clearOnDefault'
> & {
  urlKeys?: UrlKeys<Parsers>
  processUrlSearchParams?: (searchParams: URLSearchParams) => URLSearchParams
}

type SerializeFunction<
  Parsers extends ParserMap,
  BaseType extends Base = Base,
  Return = string
> = {
  /**
   * Generate a query string for the given values.
   */
  (values: Partial<Nullable<inferParserType<Parsers>>>): Return
  /**
   * Append/amend the query string of the given base with the given values.
   *
   * Existing search param values will kept, unless:
   * - the value is null, in which case the search param will be deleted
   * - another value is given for an existing key, in which case the
   *  search param will be updated
   */
  (
    base: BaseType,
    values: Partial<Nullable<inferParserType<Parsers>>> | null
  ): Return
}

export function createSerializer<
  Parsers extends ParserMap,
  BaseType extends Base = Base,
  Return = string
>(
  parsers: Parsers,
  {
    clearOnDefault = true,
    urlKeys = {},
    processUrlSearchParams
  }: CreateSerializerOptions<Parsers> = {}
): SerializeFunction<Parsers, BaseType, Return> {
  type Values = Partial<Nullable<inferParserType<Parsers>>>

  /**
   * Generate a query string for the given values.
   */
  function serialize(values: Values): Return
  /**
   * Append/amend the query string of the given base with the given values.
   *
   * Existing search param values will kept, unless:
   * - the value is null, in which case the search param will be deleted
   * - another value is given for an existing key, in which case the
   *  search param will be updated
   */
  function serialize(base: BaseType, values: Values | null): Return
  function serialize(
    arg1BaseOrValues: BaseType | Values,
    arg2values: Values | null = {}
  ) {
    let [base, search, hash] = isBase<BaseType>(arg1BaseOrValues)
      ? splitBase(arg1BaseOrValues)
      : ['', new URLSearchParams(), '']
    const values = isBase(arg1BaseOrValues) ? arg2values : arg1BaseOrValues
    if (values === null) {
      for (const key in parsers) {
        const urlKey = getUrlKey(urlKeys, key)
        search.delete(urlKey)
      }
      if (processUrlSearchParams) {
        search = processUrlSearchParams(search)
      }
      return (base + renderQueryString(search) + hash) as Return
    }
    for (const key in parsers) {
      const parser = parsers[key]
      const value = values[key]
      if (!parser || value === undefined) {
        continue
      }
      const urlKey = getUrlKey(urlKeys, key)
      const isMatchingDefault =
        parser.defaultValue !== undefined &&
        value !== null &&
        (parser.eq ?? ((a, b) => a === b))(value, parser.defaultValue)

      if (
        value === null ||
        ((parser.clearOnDefault ?? clearOnDefault ?? true) && isMatchingDefault)
      ) {
        search.delete(urlKey)
      } else {
        const serialized = parser.serialize(value)
        search = write(search, urlKey, serialized)
      }
    }
    if (processUrlSearchParams) {
      search = processUrlSearchParams(search)
    }
    return base + renderQueryString(search) + hash
  }
  return serialize
}

function isBase<BaseType>(base: any): base is BaseType {
  return (
    typeof base === 'string' ||
    base instanceof URLSearchParams ||
    base instanceof URL
  )
}

function splitBase<BaseType extends Base>(base: BaseType) {
  if (typeof base === 'string') {
    const [pathAndSearch = '', ...hashParts] = base.split('#')
    const hash = hashParts.length ? '#' + hashParts.join('#') : ''
    const [path = '', ...search] = pathAndSearch.split('?')
    return [path, new URLSearchParams(search.join('?')), hash] as const
  } else if (base instanceof URLSearchParams) {
    return ['', new URLSearchParams(base), ''] as const // Operate on a copy of URLSearchParams, as derived classes may restrict its allowed methods
  } else {
    const baseLength = base.href.length - base.search.length - base.hash.length
    const path = base.href.slice(0, baseLength).replace(/[?#]+$/, '')
    const hash = base.hash || (base.href.endsWith('#') ? '#' : '')
    return [path, new URLSearchParams(base.searchParams), hash] as const
  }
}
