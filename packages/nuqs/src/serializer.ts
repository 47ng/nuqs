import type { Nullable, Options, UrlKeys } from './defs'
import { write } from './lib/search-params'
import { renderQueryString } from './lib/url-encoding'
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
    let [base, search] = isBase<BaseType>(arg1BaseOrValues)
      ? splitBase(arg1BaseOrValues)
      : ['', new URLSearchParams()]
    const values = isBase(arg1BaseOrValues) ? arg2values : arg1BaseOrValues
    if (values === null) {
      for (const key in parsers) {
        const urlKey = urlKeys[key] ?? key
        search.delete(urlKey)
      }
      if (processUrlSearchParams) {
        search = processUrlSearchParams(search)
      }
      return (base + renderQueryString(search)) as Return
    }
    for (const key in parsers) {
      const parser = parsers[key]
      const value = values[key]
      if (!parser || value === undefined) {
        continue
      }
      const urlKey = urlKeys[key] ?? key
      const isMatchingDefault =
        parser.defaultValue !== undefined &&
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
    return base + renderQueryString(search)
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
    const [path = '', ...search] = base.split('?')
    return [path, new URLSearchParams(search.join('?'))] as const
  } else if (base instanceof URLSearchParams) {
    return ['', new URLSearchParams(base)] as const // Operate on a copy of URLSearchParams, as derived classes may restrict its allowed methods
  } else {
    return [
      base.origin + base.pathname,
      new URLSearchParams(base.searchParams)
    ] as const
  }
}
