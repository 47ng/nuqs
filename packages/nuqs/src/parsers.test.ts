import { type } from 'arktype'
import * as v from 'valibot'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsFloat,
  parseAsHex,
  parseAsIndex,
  parseAsInteger,
  parseAsIsoDate,
  parseAsIsoDateTime,
  parseAsJson,
  parseAsNativeArrayOf,
  parseAsNumberLiteral,
  parseAsString,
  parseAsStringEnum,
  parseAsStringLiteral,
  parseAsTimestamp,
  parseAsTuple
} from './parsers'
import {
  isParserBijective,
  testParseThenSerialize,
  testSerializeThenParse
} from './testing'

describe('parsers', () => {
  it('parseAsString', () => {
    expect(parseAsString.parse('')).toBe('')
    expect(parseAsString.parse('foo')).toBe('foo')
    expect(isParserBijective(parseAsString, 'foo', 'foo')).toBe(true)
  })
  it('parseAsInteger', () => {
    expect(parseAsInteger.parse('')).toBeNull()
    expect(parseAsInteger.parse('1')).toBe(1)
    expect(parseAsInteger.parse('3.14')).toBe(3)
    expect(parseAsInteger.parse('3,14')).toBe(3)
    expect(parseAsInteger.serialize(3.14)).toBe('3')
    expect(isParserBijective(parseAsInteger, '3', 3)).toBe(true)
    expect(() => testParseThenSerialize(parseAsInteger, '3.14')).toThrow()
    expect(() => testSerializeThenParse(parseAsInteger, 3.14)).toThrow()
  })
  it('parseAsHex', () => {
    expect(parseAsHex.parse('')).toBeNull()
    expect(parseAsHex.parse('1')).toBe(1)
    expect(parseAsHex.parse('a')).toBe(0xa)
    expect(parseAsHex.parse('g')).toBeNull()
    expect(parseAsHex.serialize(0xa)).toBe('0a')
    for (let byte = 0; byte < 256; byte++) {
      const hexString = byte.toString(16).padStart(2, '0')
      expect(isParserBijective(parseAsHex, hexString, byte)).toBe(true)
    }
  })
  it('parseAsFloat', () => {
    expect(parseAsFloat.parse('')).toBeNull()
    expect(parseAsFloat.parse('1')).toBe(1)
    expect(parseAsFloat.parse('3.14')).toBe(3.14)
    expect(parseAsFloat.parse('3,14')).toBe(3)
    expect(parseAsFloat.serialize(3.14)).toBe('3.14')
    // https://0.30000000000000004.com/
    expect(parseAsFloat.serialize(0.1 + 0.2)).toBe('0.30000000000000004')
    expect(isParserBijective(parseAsFloat, '3.14', 3.14)).toBe(true)
  })
  it('parseAsIndex', () => {
    expect(parseAsIndex.parse('')).toBeNull()
    expect(parseAsIndex.parse('1')).toBe(0)
    expect(parseAsIndex.parse('3.14')).toBe(2)
    expect(parseAsIndex.parse('3,14')).toBe(2)
    expect(parseAsIndex.parse('0')).toBe(-1)
    expect(parseAsIndex.parse('-1')).toBe(-2)
    expect(parseAsIndex.serialize(0)).toBe('1')
    expect(parseAsIndex.serialize(3.14)).toBe('4')
    expect(isParserBijective(parseAsIndex, '1', 0)).toBe(true)
    expect(isParserBijective(parseAsIndex, '2', 1)).toBe(true)
  })
  it('parseAsHex', () => {
    expect(parseAsHex.parse('')).toBeNull()
    expect(parseAsHex.parse('1')).toBe(1)
    expect(parseAsHex.parse('a')).toBe(0xa)
    expect(parseAsHex.parse('g')).toBeNull()
    expect(parseAsHex.serialize(0x0a)).toBe('0a')
    expect(parseAsHex.serialize(0x2a)).toBe('2a')
    expect(isParserBijective(parseAsHex, '0a', 0x0a)).toBe(true)
    expect(isParserBijective(parseAsHex, '2a', 0x2a)).toBe(true)
  })
  it('parseAsBoolean', () => {
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
    expect(isParserBijective(parseAsBoolean, 'true', true)).toBe(true)
    expect(isParserBijective(parseAsBoolean, 'false', false)).toBe(true)
  })

  it('parseAsTimestamp', () => {
    expect(parseAsTimestamp.parse('')).toBeNull()
    expect(parseAsTimestamp.parse('0')).toStrictEqual(new Date(0))
    expect(testParseThenSerialize(parseAsTimestamp, '0')).toBe(true)
    expect(testSerializeThenParse(parseAsTimestamp, new Date(1234567890))).toBe(
      true
    )
    expect(isParserBijective(parseAsTimestamp, '0', new Date(0))).toBe(true)
    expect(
      isParserBijective(parseAsTimestamp, '1234567890', new Date(1234567890))
    ).toBe(true)
  })
  it('parseAsIsoDateTime', () => {
    expect(parseAsIsoDateTime.parse('')).toBeNull()
    expect(parseAsIsoDateTime.parse('not-a-date')).toBeNull()
    const moment = '2020-01-01T00:00:00.000Z'
    const ref = new Date(moment)
    expect(parseAsIsoDateTime.parse(moment)).toStrictEqual(ref)
    expect(parseAsIsoDateTime.parse(moment.slice(0, 10))).toStrictEqual(ref)
    expect(parseAsIsoDateTime.parse(moment.slice(0, 16) + 'Z')).toStrictEqual(
      ref
    )
    expect(testParseThenSerialize(parseAsIsoDateTime, moment)).toBe(true)
    expect(testSerializeThenParse(parseAsIsoDateTime, ref)).toBe(true)
    expect(isParserBijective(parseAsIsoDateTime, moment, ref)).toBe(true)
  })
  it('parseAsIsoDate', () => {
    expect(parseAsIsoDate.parse('')).toBeNull()
    expect(parseAsIsoDate.parse('not-a-date')).toBeNull()
    const moment = '2020-01-01'
    const ref = new Date(moment)
    expect(parseAsIsoDate.parse(moment)).toStrictEqual(ref)
    expect(parseAsIsoDate.serialize(ref)).toEqual(moment)
    expect(testParseThenSerialize(parseAsIsoDate, moment)).toBe(true)
    expect(testSerializeThenParse(parseAsIsoDate, ref)).toBe(true)
    expect(isParserBijective(parseAsIsoDate, moment, ref)).toBe(true)
  })
  it('parseAsStringEnum', () => {
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
    expect(testParseThenSerialize(parser, 'a')).toBe(true)
    expect(testSerializeThenParse(parser, Test.A)).toBe(true)
    expect(isParserBijective(parser, 'b', Test.B)).toBe(true)
  })
  it('parseAsStringLiteral', () => {
    const parser = parseAsStringLiteral(['a', 'b', 'c'])
    expect(parser.parse('')).toBeNull()
    expect(parser.parse('a')).toBe('a')
    expect(parser.parse('b')).toBe('b')
    expect(parser.parse('c')).toBe('c')
    expect(parser.parse('d')).toBeNull()
    expect(parser.serialize('a')).toBe('a')
    expect(parser.serialize('b')).toBe('b')
    expect(parser.serialize('c')).toBe('c')
    expect(testParseThenSerialize(parser, 'a')).toBe(true)
    expect(testSerializeThenParse(parser, 'a')).toBe(true)
    expect(isParserBijective(parser, 'a', 'a')).toBe(true)
    expect(isParserBijective(parser, 'b', 'b')).toBe(true)
    expect(isParserBijective(parser, 'c', 'c')).toBe(true)
  })
  it('parseAsNumberLiteral', () => {
    const parser = parseAsNumberLiteral([1, 2, 3])
    expect(parser.parse('')).toBeNull()
    expect(parser.parse('1')).toBe(1)
    expect(parser.parse('2')).toBe(2)
    expect(parser.parse('3')).toBe(3)
    expect(parser.parse('4')).toBeNull()
    expect(parser.serialize(1)).toBe('1')
    expect(parser.serialize(2)).toBe('2')
    expect(parser.serialize(3)).toBe('3')
    expect(testParseThenSerialize(parser, '1')).toBe(true)
    expect(testSerializeThenParse(parser, 1)).toBe(true)
    expect(isParserBijective(parser, '1', 1)).toBe(true)
    expect(isParserBijective(parser, '2', 2)).toBe(true)
    expect(isParserBijective(parser, '3', 3)).toBe(true)
  })

  it('parseAsJson (validator: ArkType)', () => {
    const schema = type({
      foo: 'string',
      bar: 'number'
    })
    const parser = parseAsJson(schema) // note: using the schema directly
    expect(parser.parse('')).toBeNull()
    expect(parser.parse('{"foo":"abc","bar":42}')).toEqual({
      foo: 'abc',
      bar: 42
    })
    expect(parser.parse('{"foo":"abc","bar":"not-a-number"}')).toBeNull()
    expect(parser.serialize({ foo: 'abc', bar: 42 })).toBe(
      '{"foo":"abc","bar":42}'
    )
    expect(testParseThenSerialize(parser, '{"foo":"abc","bar":42}')).toBe(true)
    expect(testSerializeThenParse(parser, { foo: 'abc', bar: 42 })).toBe(true)
    expect(
      isParserBijective(parser, '{"foo":"abc","bar":42}', {
        foo: 'abc',
        bar: 42
      })
    ).toBe(true)
  })

  it('parseAsJson (validator: Valibot)', () => {
    const schema = v.object({
      foo: v.string(),
      bar: v.number()
    })
    const parser = parseAsJson(schema) // note: using the schema directly
    expect(parser.parse('')).toBeNull()
    expect(parser.parse('{"foo":"abc","bar":42}')).toEqual({
      foo: 'abc',
      bar: 42
    })
    expect(parser.parse('{"foo":"abc","bar":"not-a-number"}')).toBeNull()
    expect(parser.serialize({ foo: 'abc', bar: 42 })).toBe(
      '{"foo":"abc","bar":42}'
    )
    expect(testParseThenSerialize(parser, '{"foo":"abc","bar":42}')).toBe(true)
    expect(testSerializeThenParse(parser, { foo: 'abc', bar: 42 })).toBe(true)
    expect(
      isParserBijective(parser, '{"foo":"abc","bar":42}', {
        foo: 'abc',
        bar: 42
      })
    ).toBe(true)
  })

  it('parseAsJson (validator: Zod parse function)', () => {
    const schema = z.object({
      foo: z.string(),
      bar: z.number()
    })
    const parser = parseAsJson(schema.parse)
    expect(parser.parse('')).toBeNull()
    expect(parser.parse('{"foo":"abc","bar":42}')).toEqual({
      foo: 'abc',
      bar: 42
    })
    expect(parser.parse('{"foo":"abc","bar":"not-a-number"}')).toBeNull()
    expect(parser.serialize({ foo: 'abc', bar: 42 })).toBe(
      '{"foo":"abc","bar":42}'
    )
    expect(testParseThenSerialize(parser, '{"foo":"abc","bar":42}')).toBe(true)
    expect(testSerializeThenParse(parser, { foo: 'abc', bar: 42 })).toBe(true)
    expect(
      isParserBijective(parser, '{"foo":"abc","bar":42}', {
        foo: 'abc',
        bar: 42
      })
    ).toBe(true)
  })

  it('parseAsJson (validator: Zod schema via Standard Schema)', () => {
    const schema = z.object({
      foo: z.string(),
      bar: z.number()
    })
    const parser = parseAsJson(schema) // note: using the schema directly
    expect(parser.parse('')).toBeNull()
    expect(parser.parse('{"foo":"abc","bar":42}')).toEqual({
      foo: 'abc',
      bar: 42
    })
    expect(parser.parse('{"foo":"abc","bar":"not-a-number"}')).toBeNull()
    expect(parser.serialize({ foo: 'abc', bar: 42 })).toBe(
      '{"foo":"abc","bar":42}'
    )
    expect(testParseThenSerialize(parser, '{"foo":"abc","bar":42}')).toBe(true)
    expect(testSerializeThenParse(parser, { foo: 'abc', bar: 42 })).toBe(true)
    expect(
      isParserBijective(parser, '{"foo":"abc","bar":42}', {
        foo: 'abc',
        bar: 42
      })
    ).toBe(true)
  })

  it('parseAsArrayOf', () => {
    const parser = parseAsArrayOf(parseAsString)
    expect(parser.serialize([])).toBe('')
    // It encodes its separator
    expect(parser.serialize(['a', ',', 'b'])).toBe('a,%2C,b')
    expect(testParseThenSerialize(parser, 'a,b')).toBe(true)
    expect(testSerializeThenParse(parser, ['a', 'b'])).toBe(true)
    expect(isParserBijective(parser, 'a,b', ['a', 'b'])).toBe(true)
    expect(() =>
      isParserBijective(parser, 'not-an-array', ['a', 'b'])
    ).toThrow()
  })
  it.only('parseAsTuple', () => {
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

  describe('parseAsNativeArrayOf', () => {
    it('serializes', () => {
      const parser = parseAsNativeArrayOf(parseAsString)
      expect(parser.serialize([])).toStrictEqual([])
      expect(parser.serialize(['a', ',', 'b'])).toStrictEqual(['a', ',', 'b'])
    })
    it('parses', () => {
      const parser = parseAsNativeArrayOf(parseAsInteger)
      expect(parser.parse([])).toStrictEqual(null)
      expect(parser.parse(['1', '2'])).toStrictEqual([1, 2])
    })
    it('defaults to null', () => {
      const parser = parseAsNativeArrayOf(parseAsInteger)
      expect(parser.parse(['not', 'a', 'number'])).toStrictEqual(null)
    })
    it('is bijective', () => {
      const parser = parseAsNativeArrayOf(parseAsString)
      expect(isParserBijective(parser, ['a', 'b'], ['a', 'b'])).toBe(true)
      expect(() => isParserBijective(parser, ['1', '2'], ['a', 'b'])).toThrow()
    })
  })

  it('parseServerSide with default (#384)', () => {
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

  it('does not reset options when chaining them', () => {
    const p = parseAsString.withOptions({ scroll: true }).withOptions({})
    expect(p.scroll).toBe(true)
  })
  it('merges options when chaining them', () => {
    const p = parseAsString
      .withOptions({ scroll: true })
      .withOptions({ history: 'push' })
    expect(p.scroll).toBe(true)
    expect(p.history).toBe('push')
  })
  it('merges default values when chaining options', () => {
    const p = parseAsString
      .withOptions({ scroll: true })
      .withDefault('default')
      .withOptions({ history: 'push' })
    expect(p.scroll).toBe(true)
    expect(p.history).toBe('push')
    expect(p.defaultValue).toBe('default')
    expect(p.parseServerSide(undefined)).toBe('default')
  })
  it('allows changing the default value', () => {
    const p = parseAsString.withDefault('foo').withDefault('bar')
    expect(p.defaultValue).toBe('bar')
    expect(p.parseServerSide(undefined)).toBe('bar')
  })
})

describe('parsers/equality', () => {
  it('parseAsArrayOf', () => {
    const eq = parseAsArrayOf(parseAsString).eq!
    expect(eq([], [])).toBe(true)
    expect(eq(['foo'], ['foo'])).toBe(true)
    expect(eq(['foo', 'bar'], ['foo', 'bar'])).toBe(true)
    expect(eq([], ['foo'])).toBe(false)
    expect(eq(['foo'], ['bar'])).toBe(false)
  })
  it.only('parseAsTuple', () => {
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
