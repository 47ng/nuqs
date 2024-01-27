import type { ParserBuilder } from './parsers'
import { renderQueryString } from './url-encoding'

type ExtractParserType<Parser> = Parser extends ParserBuilder<any>
  ? ReturnType<Parser['parseServerSide']>
  : never

export function createSerializer<
  Parsers extends Record<string, ParserBuilder<any>>
>(parsers: Parsers) {
  return function serialize(values: {
    [K in keyof Parsers]?: ExtractParserType<Parsers[K]>
  }) {
    const search = new URLSearchParams()
    for (const key in parsers) {
      const parser = parsers[key]
      const value = values[key]
      if (!parser || value === undefined || value === null) {
        continue
      }
      search.set(key, parser.serialize(value))
    }
    return renderQueryString(search)
  }
}
