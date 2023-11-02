import { describe, expect, test } from 'vitest'
import {
  parseAsArrayOf,
  parseAsFloat,
  parseAsHex,
  parseAsInteger,
  parseAsIsoDateTime,
  parseAsString,
  parseAsTimestamp
} from './parsers'

describe('parsers', () => {
  test('parseAsInteger', () => {
    expect(parseAsInteger.parse('')).toBeNull()
    expect(parseAsInteger.parse('1')).toBe(1)
    expect(parseAsInteger.parse('3.14')).toBe(3)
    expect(parseAsInteger.parse('3,14')).toBe(3)
    expect(parseAsInteger.serialize(3.14)).toBe('3')
  })
  test('parseAsFloat', () => {
    expect(parseAsFloat.parse('')).toBeNull()
    expect(parseAsFloat.parse('1')).toBe(1)
    expect(parseAsFloat.parse('3.14')).toBe(3.14)
    expect(parseAsFloat.parse('3,14')).toBe(3)
    expect(parseAsFloat.serialize(3.14)).toBe('3.14')
    // https://0.30000000000000004.com/
    expect(parseAsFloat.serialize(0.1 + 0.2)).toBe('0.30000000000000004')
  })
  test('parseAsHex', () => {
    expect(parseAsHex.parse('')).toBeNull()
    expect(parseAsHex.parse('1')).toBe(1)
    expect(parseAsHex.parse('a')).toBe(0xa)
    expect(parseAsHex.parse('g')).toBeNull()
    expect(parseAsHex.serialize(0xa)).toBe('0a')
  })
  test('parseAsTimestamp', () => {
    expect(parseAsTimestamp.parse('')).toBeNull()
    expect(parseAsTimestamp.parse('0')).toStrictEqual(new Date(0))
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
  })
  test('parseAsArrayOf', () => {
    const parser = parseAsArrayOf(parseAsString)
    expect(parser.serialize([])).toBe('')
    // It encodes its separator
    expect(parser.serialize(['a', ',', 'b'])).toBe('a,%2C,b')
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
})
