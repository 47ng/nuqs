import { describe, expect, test } from 'vitest'
import type { Options } from './defs'
import {
  parseAsArrayOf,
  parseAsBoolean,
  parseAsInteger,
  parseAsJson,
  parseAsString
} from './parsers'
import { createSerializer } from './serializer'

const parsers = {
  str: parseAsString,
  int: parseAsInteger,
  bool: parseAsBoolean
}

describe('serializer', () => {
  test('empty', () => {
    const serialize = createSerializer(parsers)
    const result = serialize({})
    expect(result).toBe('')
  })
  test('one item', () => {
    const serialize = createSerializer(parsers)
    const result = serialize({ str: 'foo' })
    expect(result).toBe('?str=foo')
  })
  test('several items', () => {
    const serialize = createSerializer(parsers)
    const result = serialize({ str: 'foo', int: 1, bool: true })
    expect(result).toBe('?str=foo&int=1&bool=true')
  })
  test("null items don't show up", () => {
    const serialize = createSerializer(parsers)
    const result = serialize({ str: null })
    expect(result).toBe('')
  })
  test('with string base', () => {
    const serialize = createSerializer(parsers)
    const result = serialize('/foo', { str: 'foo' })
    expect(result).toBe('/foo?str=foo')
  })
  test('with string base with search params', () => {
    const serialize = createSerializer(parsers)
    const result = serialize('/foo?bar=egg', { str: 'foo' })
    expect(result).toBe('/foo?bar=egg&str=foo')
  })
  test('with URLSearchParams base', () => {
    const serialize = createSerializer(parsers)
    const search = new URLSearchParams('?bar=egg')
    const result = serialize(search, { str: 'foo' })
    expect(result).toBe('?bar=egg&str=foo')
  })
  test('Does not mutate existing params with URLSearchParams base', () => {
    const serialize = createSerializer(parsers)
    const searchBefore = new URLSearchParams('?str=foo')
    const result = serialize(searchBefore, { str: 'bar' })
    expect(result).toBe('?str=bar')
    expect(searchBefore.get('str')).toBe('foo')
  })
  test('with URL base', () => {
    const serialize = createSerializer(parsers)
    const url = new URL('https://example.com/path')
    const result = serialize(url, { str: 'foo' })
    expect(result).toBe('https://example.com/path?str=foo')
  })
  test('with URL base and search params', () => {
    const serialize = createSerializer(parsers)
    const url = new URL('https://example.com/path?bar=egg')
    const result = serialize(url, { str: 'foo' })
    expect(result).toBe('https://example.com/path?bar=egg&str=foo')
  })
  test('null value deletes from base', () => {
    const serialize = createSerializer(parsers)
    const result = serialize('?str=bar&int=-1', { str: 'foo', int: null })
    expect(result).toBe('?str=foo')
  })
  test('null deletes all from base', () => {
    const serialize = createSerializer(parsers)
    const result = serialize('?str=bar&int=-1', null)
    expect(result).toBe('')
  })
  test('null keeps search params not managed by the serializer', () => {
    const serialize = createSerializer(parsers)
    const result = serialize('?str=foo&external=kept', null)
    expect(result).toBe('?external=kept')
  })
  test('clears value when setting null for search param that has a default value', () => {
    const serialize = createSerializer({
      int: parseAsInteger.withDefault(0)
    })
    const result = serialize('?int=1&str=foo', { int: null })
    expect(result).toBe('?str=foo')
  })
  test('clears value when setting null for search param that is set to its default value', () => {
    const serialize = createSerializer({
      int: parseAsInteger.withDefault(0)
    })
    const result = serialize('?int=0&str=foo', { int: null })
    expect(result).toBe('?str=foo')
  })
  test('clears value when setting the default value (`clearOnDefault: true` is the default)', () => {
    const serialize = createSerializer({
      int: parseAsInteger.withDefault(0),
      str: parseAsString.withDefault(''),
      bool: parseAsBoolean.withDefault(false),
      arr: parseAsArrayOf(parseAsString).withDefault([]),
      json: parseAsJson(x => x).withDefault({ foo: 'bar' })
    })
    const result = serialize({
      int: 0,
      str: '',
      bool: false,
      arr: [],
      json: { foo: 'bar' }
    })
    expect(result).toBe('')
  })
  test('keeps value when setting the default value when `clearOnDefault: false`', () => {
    const options: Options = { clearOnDefault: false }
    const serialize = createSerializer({
      int: parseAsInteger.withOptions(options).withDefault(0),
      str: parseAsString.withOptions(options).withDefault(''),
      bool: parseAsBoolean.withOptions(options).withDefault(false),
      arr: parseAsArrayOf(parseAsString).withOptions(options).withDefault([]),
      json: parseAsJson(x => x)
        .withOptions(options)
        .withDefault({ foo: 'bar' })
    })
    const result = serialize({
      int: 0,
      str: '',
      bool: false,
      arr: [],
      json: { foo: 'bar' }
    })
    expect(result).toBe(
      '?int=0&str=&bool=false&arr=&json={%22foo%22:%22bar%22}'
    )
  })
  test('support for global clearOnDefault option', () => {
    const serialize = createSerializer(
      {
        int: parseAsInteger.withDefault(0),
        str: parseAsString.withDefault(''),
        bool: parseAsBoolean.withDefault(false),
        arr: parseAsArrayOf(parseAsString).withDefault([]),
        json: parseAsJson(x => x).withDefault({ foo: 'bar' })
      },
      { clearOnDefault: false }
    )
    const result = serialize({
      int: 0,
      str: '',
      bool: false,
      arr: [],
      json: { foo: 'bar' }
    })
    expect(result).toBe(
      '?int=0&str=&bool=false&arr=&json={%22foo%22:%22bar%22}'
    )
  })
  test('parser clearOnDefault takes precedence over global clearOnDefault', () => {
    const serialize = createSerializer(
      {
        int: parseAsInteger
          .withDefault(0)
          .withOptions({ clearOnDefault: true }),
        str: parseAsString.withDefault('')
      },
      { clearOnDefault: false }
    )
    const result = serialize({
      int: 0,
      str: ''
    })
    expect(result).toBe('?str=')
  })
  test('supports urlKeys', () => {
    const serialize = createSerializer(parsers, {
      urlKeys: {
        bool: 'b',
        int: 'i',
        str: 's'
      }
    })
    const result = serialize({ str: 'foo', int: 1, bool: true })
    expect(result).toBe('?s=foo&i=1&b=true')
  })
})
