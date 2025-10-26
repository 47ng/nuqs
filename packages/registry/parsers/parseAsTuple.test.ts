import { parseAsBoolean, parseAsInteger, parseAsString } from 'nuqs'
import {
  isParserBijective,
  testParseThenSerialize,
  testSerializeThenParse
} from 'nuqs/testing'
import { describe, expect, it } from 'vitest'
import { parseAsTuple } from './parseAsTuple'

describe('parseAsTuple', () => {
  it('parses and serializes tuples correctly', () => {
    const parser = parseAsTuple([parseAsInteger, parseAsString, parseAsBoolean])
    expect(parser.parse('1,a,false,will-ignore')).toStrictEqual([1, 'a', false])
    expect(parser.parse('not-a-number,a,true')).toBeNull()
    expect(parser.parse('1,a')).toBeNull()
    // @ts-expect-error - Tuple length is less than 2
    expect(() => parseAsTuple([parseAsInteger])).toThrow()
    expect(parser.serialize([1, 'a', true])).toBe('1,a,true')
    // @ts-expect-error - Tuple length mismatch
    expect(() => parser.serialize([1, 'a'])).toThrow()
    expect(testParseThenSerialize(parser, '1,a,true')).toBe(true)
    expect(testSerializeThenParse(parser, [1, 'a', true] as const)).toBe(true)
    expect(isParserBijective(parser, '1,a,true', [1, 'a', true] as const)).toBe(
      true
    )
    expect(() =>
      isParserBijective(parser, 'not-a-tuple', [1, 'a', true] as const)
    ).toThrow()
  })

  it('equality comparison works correctly', () => {
    const eq = parseAsTuple([parseAsInteger, parseAsBoolean]).eq!
    expect(eq([1, true], [1, true])).toBe(true)
    expect(eq([1, true], [1, false])).toBe(false)
    expect(eq([1, true], [2, true])).toBe(false)
    // @ts-expect-error - Tuple length mismatch
    expect(eq([1, true], [1])).toBe(false)
    // @ts-expect-error - Tuple length mismatch
    expect(eq([1], [1])).toBe(false)
  })
})
