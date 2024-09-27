import { describe, expect, test } from 'vitest'
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
  test('clears value when setting the default value when `clearOnDefault` is used', () => {
    const serialize = createSerializer({
      int: parseAsInteger.withOptions({ clearOnDefault: true }).withDefault(0),
      str: parseAsString.withOptions({ clearOnDefault: true }).withDefault(''),
      bool: parseAsBoolean
        .withOptions({ clearOnDefault: true })
        .withDefault(false),
      arr: parseAsArrayOf(parseAsString)
        .withOptions({ clearOnDefault: true })
        .withDefault([]),
      json: parseAsJson()
        .withOptions({ clearOnDefault: true })
        .withDefault({ foo: 'bar' })
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
})
