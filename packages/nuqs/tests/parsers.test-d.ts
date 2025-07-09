import { assertType, describe, expectTypeOf, it, test } from 'vitest'
import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsFloat,
  parseAsHex,
  parseAsInteger,
  parseAsIsoDate,
  parseAsIsoDateTime,
  parseAsJson,
  parseAsNumberLiteral,
  parseAsString,
  parseAsStringEnum,
  parseAsStringLiteral,
  parseAsTimestamp,
  type inferParserType
} from '../dist'

describe('types/parsers', () => {
  test('parseAsString', () => {
    const p = parseAsString
    assertType<string | null>(p.parse('foo'))
    assertType<string>(p.serialize('foo'))
    assertType<string | null>(p.parseServerSide(undefined))
  })
  test('parseAsInteger', () => {
    const p = parseAsInteger
    assertType<number | null>(p.parse('42'))
    assertType<string>(p.serialize(42))
    assertType<number | null>(p.parseServerSide(undefined))
  })
  test('parseAsHex', () => {
    const p = parseAsHex
    assertType<number | null>(p.parse('42'))
    assertType<string>(p.serialize(42))
    assertType<number | null>(p.parseServerSide(undefined))
  })
  test('parseAsFloat', () => {
    const p = parseAsFloat
    assertType<number | null>(p.parse('42'))
    assertType<string>(p.serialize(42))
    assertType<number | null>(p.parseServerSide(undefined))
  })
  test('parseAsBoolean', () => {
    const p = parseAsBoolean
    assertType<boolean | null>(p.parse('true'))
    assertType<string>(p.serialize(true))
    assertType<boolean | null>(p.parseServerSide(undefined))
  })
  test('parseAsTimestamp', () => {
    const p = parseAsTimestamp
    assertType<Date | null>(p.parse('2020-01-01T00:00:00Z'))
    assertType<string>(p.serialize(new Date()))
    assertType<Date | null>(p.parseServerSide(undefined))
  })
  test('parseAsIsoDateTime', () => {
    const p = parseAsIsoDateTime
    assertType<Date | null>(p.parse('2020-01-01T00:00:00Z'))
    assertType<string>(p.serialize(new Date()))
    assertType<Date | null>(p.parseServerSide(undefined))
  })
  test('parseAsIsoDate', () => {
    const p = parseAsIsoDate
    assertType<Date | null>(p.parse('2020-01-01T00:00:00Z'))
    assertType<string>(p.serialize(new Date()))
    assertType<Date | null>(p.parseServerSide(undefined))
  })
  test('parseAsStringEnum', () => {
    enum Test {
      A = 'a',
      B = 'b'
    }
    const p = parseAsStringEnum<Test>(Object.values(Test))
    assertType<Test | null>(p.parse('a'))
    assertType<string>(p.serialize(Test.A))
    assertType<Test | null>(p.parseServerSide(undefined))
  })
  test('parseAsStringLiteral', () => {
    const p = parseAsStringLiteral(['a', 'b'])
    assertType<'a' | 'b' | null>(p.parse('a'))
    assertType<string>(p.serialize('a'))
    assertType<'a' | 'b' | null>(p.parseServerSide(undefined))
  })
  test('parseAsNumberLiteral', () => {
    const p = parseAsNumberLiteral([1, 2, 3])
    assertType<1 | 2 | 3 | null>(p.parse('42'))
    assertType<string>(p.serialize(1))
    assertType<1 | 2 | 3 | null>(p.parseServerSide(undefined))
  })
  test('parseAsJson returns the return type of the validator', () => {
    type T = { test: string }
    const p = parseAsJson(value => value as T)
    assertType<T | null>(p.parse('foo'))
    assertType<string>(p.serialize({ test: 'foo' }))
    assertType<T | null>(p.parseServerSide(undefined))
  })
  test('parseAsArrayOf composes existing item parsers', () => {
    const p = parseAsArrayOf(parseAsInteger)
    assertType<number[] | null>(p.parse('42'))
    assertType<string>(p.serialize([42]))
    assertType<number[] | null>(p.parseServerSide(undefined))
  })

  it('removes null from the type when the parser has a default value', () => {
    const p = parseAsString.withDefault('default')
    assertType<string | null>(p.parse('foo')) // This one allows null (can fail)
    assertType<string>(p.parseServerSide(undefined)) // This one doesn't (defaults)
  })
  it('keeps the default value type-safe when combining with options (builder pattern)', () => {
    const a = parseAsString.withDefault('default').withOptions({ scroll: true })
    assertType<string | null>(a.parse('foo'))
    assertType<string>(a.parseServerSide(undefined))
    const b = parseAsString.withOptions({ scroll: true }).withDefault('default')
    assertType<string | null>(b.parse('foo'))
    assertType<string>(b.parseServerSide(undefined))
  })
})

describe('types/parsers: inferParserType', () => {
  it('infers the type of a single parser', () => {
    expectTypeOf<inferParserType<typeof parseAsString>>().toEqualTypeOf<
      string | null
    >()
  })
  it('infers the type of a parser with a default value', () => {
    const withDefault = parseAsString.withDefault('')
    expectTypeOf<inferParserType<typeof withDefault>>().toEqualTypeOf<string>()
  })
  it('infers the type of an object of parsers', () => {
    const parsers = {
      str: parseAsString,
      int: parseAsInteger
    }
    expectTypeOf<inferParserType<typeof parsers>>().toEqualTypeOf<{
      str: string | null
      int: number | null
    }>()
  })
  it('infers the type of an object of parsers with default values', () => {
    const parsers = {
      str: parseAsString.withDefault(''),
      int: parseAsInteger.withDefault(0)
    }
    expectTypeOf<inferParserType<typeof parsers>>().toEqualTypeOf<{
      str: string
      int: number
    }>()
  })
})
