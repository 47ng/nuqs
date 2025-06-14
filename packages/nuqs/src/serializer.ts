import type { Nullable, Options, UrlKeys } from './defs'
import { renderQueryString } from './lib/url-encoding'
import type { inferParserType, ParserMap } from './parsers'

type Base = string | URLSearchParams | URL

type SerializeFunction<Parsers extends ParserMap> = {
  /**
   * Generate a query string for the given values.
   */
  (values: Partial<Nullable<inferParserType<Parsers>>>): string
  /**
   * Append/amend the query string of the given base with the given values.
   *
   * Existing search param values will kept, unless:
   * - the value is null, in which case the search param will be deleted
   * - another value is given for an existing key, in which case the
   *  search param will be updated
   */
  (
    base: Base,
    values: Partial<Nullable<inferParserType<Parsers>>> | null
  ): string
}

export function createSerializer<Parsers extends ParserMap>(
  parsers: Parsers,
  {
    clearOnDefault = true,
    urlKeys = {}
  }: Pick<Options, 'clearOnDefault'> & {
    urlKeys?: UrlKeys<Parsers>
  } = {}
): SerializeFunction<Parsers> {
  type Values = Partial<Nullable<inferParserType<Parsers>>>

  /**
   * Generate a query string for the given values.
   */
  function serialize(values: Values): string
  /**
   * Append/amend the query string of the given base with the given values.
   *
   * Existing search param values will kept, unless:
   * - the value is null, in which case the search param will be deleted
   * - another value is given for an existing key, in which case the
   *  search param will be updated
   */
  function serialize(base: Base, values: Values | null): string
  function serialize(
    arg1BaseOrValues: Base | Values | null,
    arg2values: Values | null = {}
  ) {
    const [base, search] = isBase(arg1BaseOrValues)
      ? splitBase(arg1BaseOrValues)
      : ['', new URLSearchParams()]
    const values = isBase(arg1BaseOrValues) ? arg2values : arg1BaseOrValues
    if (values === null) {
      for (const key in parsers) {
        const urlKey = urlKeys[key] ?? key
        search.delete(urlKey)
      }
      return base + renderQueryString(search)
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
        search.set(urlKey, parser.serialize(value))
      }
    }
    return base + renderQueryString(search)
  }
  return serialize
}

function isBase(base: any): base is Base {
  return (
    typeof base === 'string' ||
    base instanceof URLSearchParams ||
    base instanceof URL
  )
}

function splitBase(base: Base) {
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
