import { describe, expect, test } from 'vitest'
import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsFloat,
  parseAsHex,
  parseAsIndex,
  parseAsInteger,
  parseAsIsoDate,
  parseAsIsoDateTime,
  parseAsNumberLiteral,
  parseAsString,
  parseAsStringEnum,
  parseAsStringLiteral,
  parseAsTimestamp
} from './parsers'
import { testParseThenSerialize, testSerializeThenParse } from './testing'

describe('parsers', () => {
  test('parseAsString', () => {
    expect(parseAsString.parse('')).toBe('')
    expect(parseAsString.parse('foo')).toBe('foo')
    testParseThenSerialize(parseAsString, 'foo')
    testSerializeThenParse(parseAsString, 'foo')
  })
  test('parseAsInteger', () => {
    expect(parseAsInteger.parse('')).toBeNull()
    expect(parseAsInteger.parse('1')).toBe(1)
    expect(parseAsInteger.parse('3.14')).toBe(3)
    expect(parseAsInteger.parse('3,14')).toBe(3)
    expect(parseAsInteger.serialize(3.14)).toBe('3')
    testParseThenSerialize(parseAsInteger, '3')
    testSerializeThenParse(parseAsInteger, 3)
    expect(() => testParseThenSerialize(parseAsInteger, '3.14')).toThrow()
    expect(() => testSerializeThenParse(parseAsInteger, 3.14)).toThrow()
  })
  test('parseAsHex', () => {
    expect(parseAsHex.parse('')).toBeNull()
    expect(parseAsHex.parse('1')).toBe(1)
    expect(parseAsHex.parse('a')).toBe(0xa)
    expect(parseAsHex.parse('g')).toBeNull()
    expect(parseAsHex.serialize(0xa)).toBe('0a')
    for (let i = 0; i < 256; i++) {
      const hex = i.toString(16).padStart(2, '0')
      testParseThenSerialize(parseAsHex, hex)
      testSerializeThenParse(parseAsHex, i)
    }
  })
  test('parseAsFloat', () => {
    expect(parseAsFloat.parse('')).toBeNull()
    expect(parseAsFloat.parse('1')).toBe(1)
    expect(parseAsFloat.parse('3.14')).toBe(3.14)
    expect(parseAsFloat.parse('3,14')).toBe(3)
    expect(parseAsFloat.serialize(3.14)).toBe('3.14')
    // https://0.30000000000000004.com/
    expect(parseAsFloat.serialize(0.1 + 0.2)).toBe('0.30000000000000004')
    testParseThenSerialize(parseAsFloat, '3.14')
    testSerializeThenParse(parseAsFloat, 3.14)
  })
  test('parseAsIndex', () => {
    expect(parseAsIndex.parse('')).toBeNull()
    expect(parseAsIndex.parse('1')).toBe(0)
    expect(parseAsIndex.parse('3.14')).toBe(2)
    expect(parseAsIndex.parse('3,14')).toBe(2)
    expect(parseAsIndex.parse('0')).toBe(-1)
    expect(parseAsIndex.parse('-1')).toBe(-2)
    expect(parseAsIndex.serialize(0)).toBe('1')
    expect(parseAsIndex.serialize(3.14)).toBe('4')
    testParseThenSerialize(parseAsIndex, '0')
    testParseThenSerialize(parseAsIndex, '1')
    testSerializeThenParse(parseAsIndex, 0)
    testSerializeThenParse(parseAsIndex, 1)
  })
  test('parseAsHex', () => {
    expect(parseAsHex.parse('')).toBeNull()
    expect(parseAsHex.parse('1')).toBe(1)
    expect(parseAsHex.parse('a')).toBe(0xa)
    expect(parseAsHex.parse('g')).toBeNull()
    expect(parseAsHex.serialize(0xa)).toBe('0a')
  })
  test('parseAsBoolean', () => {
    expect(parseAsBoolean.parse('')).toBe(false)
    // In only triggers on 'true', everything else is false
    expect(parseAsBoolean.parse('true')).toBe(true)
    expect(parseAsBoolean.parse('false')).toBe(false)
    expect(parseAsBoolean.parse('0')).toBe(false)
    expect(parseAsBoolean.parse('1')).toBe(false)
    expect(parseAsBoolean.parse('yes')).toBe(false)
    expect(parseAsBoolean.parse('no')).toBe(false)
    expect(parseAsBoolean.serialize(true)).toBe('true')
    expect(parseAsBoolean.serialize(false)).toBe('false')
    testParseThenSerialize(parseAsBoolean, 'true')
    testSerializeThenParse(parseAsBoolean, true)
    testParseThenSerialize(parseAsBoolean, 'false')
    testSerializeThenParse(parseAsBoolean, false)
  })

  test('parseAsTimestamp', () => {
    expect(parseAsTimestamp.parse('')).toBeNull()
    expect(parseAsTimestamp.parse('0')).toStrictEqual(new Date(0))
    testParseThenSerialize(parseAsTimestamp, '0')
    testSerializeThenParse(parseAsTimestamp, new Date(1234567890))
  })
  test('parseAsIsoDateTime', () => {
    expect(parseAsIsoDateTime.parse('')).toBeNull()
    expect(parseAsIsoDateTime.parse('not-a-date')).toBeNull()
    const moment = '2020-01-01T00:00:00.000Z'
    const ref = new Date(moment)
    expect(parseAsIsoDateTime.parse(moment)).toStrictEqual(ref)
    expect(parseAsIsoDateTime.parse(moment.slice(0, 10))).toStrictEqual(ref)
    expect(parseAsIsoDateTime.parse(moment.slice(0, 16) + 'Z')).toStrictEqual(
      ref
    )
    testParseThenSerialize(parseAsIsoDateTime, moment)
    testSerializeThenParse(parseAsIsoDateTime, ref)
  })
  test('parseAsIsoDate', () => {
    expect(parseAsIsoDate.parse('')).toBeNull()
    expect(parseAsIsoDate.parse('not-a-date')).toBeNull()
    const moment = '2020-01-01'
    const ref = new Date(moment)
    expect(parseAsIsoDate.parse(moment)).toStrictEqual(ref)
    expect(parseAsIsoDate.serialize(ref)).toEqual(moment)
    testParseThenSerialize(parseAsIsoDate, moment)
    testSerializeThenParse(parseAsIsoDate, ref)
  })
  test('parseAsStringEnum', () => {
    enum Test {
      A = 'a',
      B = 'b',
      C = 'c'
    }
    const parser = parseAsStringEnum<Test>(Object.values(Test))
    expect(parser.parse('')).toBeNull()
    expect(parser.parse('a')).toBe('a')
    expect(parser.parse('b')).toBe('b')
    expect(parser.parse('c')).toBe('c')
    expect(parser.parse('d')).toBeNull()
    expect(parser.serialize(Test.A)).toBe('a')
    expect(parser.serialize(Test.B)).toBe('b')
    expect(parser.serialize(Test.C)).toBe('c')
    testParseThenSerialize(parser, 'a')
    testSerializeThenParse(parser, Test.A)
  })
  test('parseAsStringLiteral', () => {
    const parser = parseAsStringLiteral(['a', 'b', 'c'] as const)
    expect(parser.parse('')).toBeNull()
    expect(parser.parse('a')).toBe('a')
    expect(parser.parse('b')).toBe('b')
    expect(parser.parse('c')).toBe('c')
    expect(parser.parse('d')).toBeNull()
    expect(parser.serialize('a')).toBe('a')
    expect(parser.serialize('b')).toBe('b')
    expect(parser.serialize('c')).toBe('c')
    testParseThenSerialize(parser, 'a')
    testSerializeThenParse(parser, 'a')
  })
  test('parseAsNumberLiteral', () => {
    const parser = parseAsNumberLiteral([1, 2, 3] as const)
    expect(parser.parse('')).toBeNull()
    expect(parser.parse('1')).toBe(1)
    expect(parser.parse('2')).toBe(2)
    expect(parser.parse('3')).toBe(3)
    expect(parser.parse('4')).toBeNull()
    expect(parser.serialize(1)).toBe('1')
    expect(parser.serialize(2)).toBe('2')
    expect(parser.serialize(3)).toBe('3')
    testParseThenSerialize(parser, '1')
    testSerializeThenParse(parser, 1)
  })

  test('parseAsArrayOf', () => {
    const parser = parseAsArrayOf(parseAsString)
    expect(parser.serialize([])).toBe('')
    // It encodes its separator
    expect(parser.serialize(['a', ',', 'b'])).toBe('a,%2C,b')
    testParseThenSerialize(parser, 'a,b')
    testSerializeThenParse(parser, ['a', 'b'])
  })

  test('parseServerSide with default (#384)', () => {
    const p = parseAsString.withDefault('default')
    const searchParams = {
      string: 'foo',
      stringArray: ['bar', 'egg'],
      undef: undefined
    }
    expect(p.parseServerSide(searchParams.undef)).toBe('default')
    expect(p.parseServerSide(searchParams.string)).toBe('foo')
    expect(p.parseServerSide(searchParams.stringArray)).toBe('bar')
    // @ts-expect-error - Implicitly undefined
    expect(p.parseServerSide(searchParams.nope)).toBe('default')
  })

  test('chaining options does not reset them', () => {
    const p = parseAsString.withOptions({ scroll: true }).withOptions({})
    expect(p.scroll).toBe(true)
  })
  test('chaining options merges them', () => {
    const p = parseAsString
      .withOptions({ scroll: true })
      .withOptions({ history: 'push' })
    expect(p.scroll).toBe(true)
    expect(p.history).toBe('push')
  })
  test('chaining options & default value', () => {
    const p = parseAsString
      .withOptions({ scroll: true })
      .withDefault('default')
      .withOptions({ history: 'push' })
    expect(p.scroll).toBe(true)
    expect(p.history).toBe('push')
    expect(p.defaultValue).toBe('default')
    expect(p.parseServerSide(undefined)).toBe('default')
  })
  test('changing default value', () => {
    const p = parseAsString.withDefault('foo').withDefault('bar')
    expect(p.defaultValue).toBe('bar')
    expect(p.parseServerSide(undefined)).toBe('bar')
  })
})

describe('parsers/equality', () => {
  test('parseAsArrayOf', () => {
    const eq = parseAsArrayOf(parseAsString).eq!
    expect(eq([], [])).toBe(true)
    expect(eq(['foo'], ['foo'])).toBe(true)
    expect(eq(['foo', 'bar'], ['foo', 'bar'])).toBe(true)
    expect(eq([], ['foo'])).toBe(false)
    expect(eq(['foo'], ['bar'])).toBe(false)
  })
})
