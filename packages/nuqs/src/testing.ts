import type { ParserBuilder } from './parsers'

/**
 * Test that a parser is bijective (serialize then parse gives back the same value).
 *
 * It will throw if the parser is not bijective (if the parsed value is not equal to the input value).
 * The parser's `eq` function is used to compare the values.
 *
 * Usage:
 * ```ts
 * // Expect it to pass (no error thrown)
 * testSerializeThenParse(myParser, 'foo')
 * // Expect it to fail
 * expect(() => testSerializeThenParse(myParser, 'bar')).toThrow()
 * ```
 *
 * @param parser The parser to test
 * @param input An input value to test against
 */
export function testSerializeThenParse<T>(parser: ParserBuilder<T>, input: T) {
  const serialized = parser.serialize(input)
  const parsed = parser.parse(serialized)
  if (parsed === null) {
    throw new Error(
      `[nuqs] testSerializeThenParse: parsed value is null (when parsing ${serialized} serialized from ${input})`
    )
  }
  if (!parser.eq(input, parsed)) {
    throw new Error(
      `[nuqs] parser is not bijective (in testSerializeThenParse)
  Expected value:         ${typeof input === 'object' ? JSON.stringify(input) : input}
  Received parsed value:  ${typeof parsed === 'object' ? JSON.stringify(parsed) : parsed}
  Serialized as: '${serialized}'
  `
    )
  }
}

/**
 * Tests that a parser is bijective (parse then serialize gives back the same query string).
 *
 * It will throw if the parser is not bijective (if the serialized value is not equal to the input query).
 *
 * Usage:
 * ```ts
 * // Expect it to pass (no error thrown)
 * testParseThenSerialize(myParser, 'foo')
 * // Expect it to fail
 * expect(() => testParseThenSerialize(myParser, 'bar')).toThrow()
 * ```
 *
 * @param parser The parser to test
 * @param input A query string to test against
 */
export function testParseThenSerialize<T>(
  parser: ParserBuilder<T>,
  input: string
) {
  const parsed = parser.parse(input)
  if (parsed === null) {
    throw new Error(
      `[nuqs] testParseThenSerialize: parsed value is null (when parsing ${input})`
    )
  }
  const serialized = parser.serialize(parsed)
  if (serialized !== input) {
    throw new Error(
      `[nuqs] parser is not bijective (in testParseThenSerialize)
  Expected query: '${input}'
  Received query: '${serialized}'
  Parsed value: ${parsed}
`
    )
  }
}
