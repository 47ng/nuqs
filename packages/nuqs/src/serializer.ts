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
  function serialize(arg1: BaseType | Values, arg2: Values | null = {}) {
    let base = ''
    let search = new URLSearchParams()
    const isB =
      typeof arg1 === 'string' ||
      arg1 instanceof URLSearchParams ||
      arg1 instanceof URL
    if (typeof arg1 === 'string') {
      const [p = '', ...s] = arg1.split('?')
      base = p
      search = new URLSearchParams(s.join('?'))
    } else if (arg1 instanceof URL) {
      base = arg1.origin + arg1.pathname
      search = new URLSearchParams(arg1.searchParams)
    } else if (arg1 instanceof URLSearchParams) {
      // Copy URLSearchParams as derived classes may restrict allowed methods
      search = new URLSearchParams(arg1)
    }
    const values = (isB ? arg2 : arg1) as Values | null
    for (const key in parsers) {
      const p = parsers[key]
      const u = urlKeys[key] ?? key
      const v = values === null ? null : values[key]
      if (!p || v === undefined) continue
      const def = p.defaultValue
      if (
        v === null ||
        ((p.clearOnDefault ?? clearOnDefault) &&
          def !== undefined &&
          (p.eq ?? ((a, b) => a === b))(v, def))
      ) {
        search.delete(u)
      } else {
        search = write(search, u, p.serialize(v))
      }
    }
    if (processUrlSearchParams) search = processUrlSearchParams(search)
    return (base + renderQueryString(search)) as Return
  }
  return serialize
}
