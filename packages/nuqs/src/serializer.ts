import type { ParserBuilder } from './parsers'
import { renderQueryString } from './url-encoding'

type ExtractParserType<Parser> =
  Parser extends ParserBuilder<any>
    ? ReturnType<Parser['parseServerSide']>
    : never

type Base = string | URLSearchParams | URL
type Values<Parsers extends Record<string, ParserBuilder<any>>> = Partial<{
  [K in keyof Parsers]?: ExtractParserType<Parsers[K]>
}>
type ParserWithOptionalDefault<T> = ParserBuilder<T> & { defaultValue?: T }

export function createSerializer<
  Parsers extends Record<string, ParserWithOptionalDefault<any>>
>(parsers: Parsers) {
  /**
   * Generate a query string for the given values.
   */
  function serialize(values: Values<Parsers>): string
  /**
   * Append/amend the query string of the given base with the given values.
   *
   * Existing search param values will kept, unless:
   * - the value is null, in which case the search param will be deleted
   * - another value is given for an existing key, in which case the
   *  search param will be updated
   */
  function serialize(base: Base, values: Values<Parsers>): string
  function serialize(
    baseOrValues: Base | Values<Parsers>,
    values: Values<Parsers> = {}
  ) {
    const [base, search] = isBase(baseOrValues)
      ? splitBase(baseOrValues)
      : ['', new URLSearchParams()]
    const vals = isBase(baseOrValues) ? values : baseOrValues
    for (const key in parsers) {
      const parser = parsers[key]
      const value = vals[key]
      if (!parser || value === undefined) {
        continue
      }
      const isMatchingDefault =
        parser.defaultValue !== undefined &&
        (parser.eq ?? ((a, b) => a === b))(value, parser.defaultValue)

      if (value === null || (parser.clearOnDefault && isMatchingDefault)) {
        search.delete(key)
      } else {
        search.set(key, parser.serialize(value))
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
    const [path = '', search] = base.split('?')
    return [path, new URLSearchParams(search)] as const
  } else if (base instanceof URLSearchParams) {
    return ['', new URLSearchParams(base)] as const // Operate on a copy of URLSearchParams, as derived classes may restrict its allowed methods
  } else {
    return [base.origin + base.pathname, base.searchParams] as const
  }
}
