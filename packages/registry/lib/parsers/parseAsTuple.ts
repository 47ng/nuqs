import { createParser, type SingleParserBuilder } from 'nuqs'
import { nuqsSafeParse } from '../nuqs-safe-parse'

type ParserTuple<T extends readonly unknown[]> = {
  [K in keyof T]: SingleParserBuilder<T[K]>
} & { length: 2 | 3 | 4 | 5 | 6 | 7 | 8 }

/**
 * Parse a comma-separated tuple with type-safe positions.
 * Items are URI-encoded for safety, so they may not look nice in the URL.
 * allowed tuple length is 2-8.
 *
 * @param itemParsers Tuple of parsers for each position in the tuple
 * @param separator The character to use to separate items (default ',')
 */
export function parseAsTuple<T extends any[]>(
  itemParsers: ParserTuple<T>,
  separator = ','
): SingleParserBuilder<T> {
  const encodedSeparator = encodeURIComponent(separator)
  if (itemParsers.length < 2 || itemParsers.length > 8) {
    throw new Error(
      `Tuple length must be between 2 and 8, got ${itemParsers.length}`
    )
  }
  return createParser<T>({
    parse: query => {
      if (query === '') {
        return null
      }
      const parts = query.split(separator)
      if (parts.length < itemParsers.length) {
        return null
      }
      // iterating by parsers instead of parts, any additional parts are ignored.
      const result = itemParsers.map(
        (parser, index) =>
          nuqsSafeParse(
            parser.parse,
            parts[index]!.replaceAll(encodedSeparator, separator),
            `[${index}]`
          ) as T[number] | null
      )
      return result.some(x => x === null) ? null : (result as T)
    },
    serialize: (values: T) => {
      if (values.length !== itemParsers.length) {
        throw new Error(
          `Tuple length mismatch: expected ${itemParsers.length}, got ${values.length}`
        )
      }
      return values
        .map((value, index) => {
          const parser = itemParsers[index]!
          const str = parser.serialize ? parser.serialize(value) : String(value)
          return str.replaceAll(separator, encodedSeparator)
        })
        .join(separator)
    },
    eq(a: T, b: T) {
      if (a === b) {
        return true
      }
      if (a.length !== b.length || a.length !== itemParsers.length) {
        return false
      }
      return a.every((value, index) => {
        const parser = itemParsers[index]!
        const itemEq = parser.eq ?? ((x, y) => x === y)
        return itemEq(value, b[index])
      })
    }
  })
}
