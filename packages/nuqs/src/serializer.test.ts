import { describe, expect, it } from 'vitest'
import type { Options } from './defs'
import {
  createMultiParser,
  createParser,
  parseAsArrayOf,
  parseAsBoolean,
  parseAsInteger,
  parseAsJson,
  parseAsNativeArrayOf,
  parseAsString
} from './parsers'
import { createSerializer } from './serializer'

const parsers = {
  str: parseAsString,
  int: parseAsInteger,
  bool: parseAsBoolean,
  multi: parseAsNativeArrayOf(parseAsString)
}

describe('serializer', () => {
  it('handles empty inputs', () => {
    const serialize = createSerializer(parsers)
    const result = serialize({})
    expect(result).toBe('')
  })
  it('handles a single item', () => {
    const serialize = createSerializer(parsers)
    const result = serialize({ str: 'foo' })
    expect(result).toBe('?str=foo')
  })
  it('handles several items', () => {
    const serialize = createSerializer(parsers)
    const result = serialize({ str: 'foo', int: 1, bool: true })
    expect(result).toBe('?str=foo&int=1&bool=true')
  })
  it('does not render null items', () => {
    const serialize = createSerializer(parsers)
    const result = serialize({ str: null })
    expect(result).toBe('')
  })
  it('handles a string base', () => {
    const serialize = createSerializer(parsers)
    const result = serialize('/foo', { str: 'foo' })
    expect(result).toBe('/foo?str=foo')
  })
  it('handles a string base with search params', () => {
    const serialize = createSerializer(parsers)
    const result = serialize('/foo?bar=egg', { str: 'foo' })
    expect(result).toBe('/foo?bar=egg&str=foo')
  })
  it('handles a URLSearchParams base', () => {
    const serialize = createSerializer(parsers)
    const search = new URLSearchParams('?bar=egg')
    const result = serialize(search, { str: 'foo' })
    expect(result).toBe('?bar=egg&str=foo')
  })
  it('does not mutate existing params with URLSearchParams base', () => {
    const serialize = createSerializer(parsers)
    const searchBefore = new URLSearchParams('?str=foo')
    const result = serialize(searchBefore, { str: 'bar' })
    expect(result).toBe('?str=bar')
    expect(searchBefore.get('str')).toBe('foo')
  })
  it('handles a URL base', () => {
    const serialize = createSerializer(parsers)
    const url = new URL('https://example.com/path')
    const result = serialize(url, { str: 'foo' })
    expect(result).toBe('https://example.com/path?str=foo')
  })
  it('handles a URL base and merges search params', () => {
    const serialize = createSerializer(parsers)
    const url = new URL('https://example.com/path?bar=egg')
    const result = serialize(url, { str: 'foo' })
    expect(result).toBe('https://example.com/path?bar=egg&str=foo')
  })
  it('preserves credentials in string and URL bases', () => {
    const serialize = createSerializer(parsers)
    const base = 'https://user:password@example.com/path?bar=egg'
    const expected = 'https://user:password@example.com/path?bar=egg&str=foo'
    expect(serialize(base, { str: 'foo' })).toBe(expected)
    expect(serialize(new URL(base), { str: 'foo' })).toBe(expected)
  })
  it.each([
    [
      'empty search',
      'https://example.com/path?',
      'https://example.com/path?str=foo'
    ],
    [
      'empty hash',
      'https://example.com/path#',
      'https://example.com/path?str=foo#'
    ],
    [
      'empty search and hash',
      'https://example.com/path?#',
      'https://example.com/path?str=foo#'
    ],
    [
      'empty search before a hash',
      'https://example.com/path?#section',
      'https://example.com/path?str=foo#section'
    ]
  ])('handles $0 in string and URL bases', (_, base, expected) => {
    const serialize = createSerializer(parsers)
    expect(serialize(base, { str: 'foo' })).toBe(expected)
    expect(serialize(new URL(base), { str: 'foo' })).toBe(expected)
  })
  it('preserves hashes that contain hash characters', () => {
    const serialize = createSerializer(parsers)
    expect(serialize('/foo#section#nested', { str: 'foo' })).toBe(
      '/foo?str=foo#section#nested'
    )
  })
  it('deletes a null value from base', () => {
    const serialize = createSerializer(parsers)
    const result = serialize('?str=bar&int=-1', { str: 'foo', int: null })
    expect(result).toBe('?str=foo')
  })
  it('deletes all from base with a global null', () => {
    const serialize = createSerializer(parsers)
    const result = serialize('?str=bar&int=-1', null)
    expect(result).toBe('')
  })
  it('keeps search params in the base when given undefined as value', () => {
    const serialize = createSerializer(parsers)
    const result = serialize('?str=foo', { str: undefined })
    expect(result).toBe('?str=foo')
  })
  it('accepts an immutable search-parameter processor when clearing all managed values', () => {
    const serialize = createSerializer(parsers, {
      urlKeys: { str: 's' },
      processUrlSearchParams(search) {
        return new URLSearchParams([...search.entries(), ['processed', 'true']])
      }
    })
    expect(serialize('?s=foo&external=kept', null)).toBe(
      '?external=kept&processed=true'
    )
  })
  it('accepts a mutating search-parameter processor when clearing all managed values', () => {
    const serialize = createSerializer(parsers, {
      urlKeys: { str: 's' },
      processUrlSearchParams(search) {
        search.set('processed', 'true')
        return search
      }
    })
    expect(serialize('?s=foo&external=kept', null)).toBe(
      '?external=kept&processed=true'
    )
  })
  it('keeps values from parsers without a default even when their equality function is permissive', () => {
    const serialize = createSerializer({
      str: createParser({
        parse: String,
        serialize: String,
        eq: () => true
      })
    })
    expect(serialize({ str: 'value' })).toBe('?str=value')
  })
  it('clears a multi-parser default using its default equality', () => {
    const parser = createMultiParser({
      parse: values => values[0] ?? null,
      serialize: value => [value]
    }).withDefault('default')
    const serialize = createSerializer({ value: parser })
    expect(serialize({ value: 'default' })).toBe('')
    expect(serialize({ value: 'other' })).toBe('?value=other')
  })
  it('keeps search params not managed by the serializer when fed null', () => {
    const serialize = createSerializer(parsers)
    const result = serialize('?str=foo&external=kept', null)
    expect(result).toBe('?external=kept')
  })
  it('clears value when setting null for a search param that has a default value', () => {
    const serialize = createSerializer({
      int: parseAsInteger.withDefault(0)
    })
    const result = serialize('?int=1&str=foo', { int: null })
    expect(result).toBe('?str=foo')
  })
  it('clears value when setting null for æ search param that is set to its default value', () => {
    const serialize = createSerializer({
      int: parseAsInteger.withDefault(0)
    })
    const result = serialize('?int=0&str=foo', { int: null })
    expect(result).toBe('?str=foo')
  })
  it('clears value when setting null for an array parser with a default value', () => {
    const serialize = createSerializer({
      arr: parseAsArrayOf(parseAsString).withDefault([])
    })
    const result = serialize('?arr=a&arr=b&str=foo', { arr: null })
    expect(result).toBe('?str=foo')
  })
  it('clears value when setting the default value (`clearOnDefault: true` is the default)', () => {
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
  it('keeps value when setting the default value when `clearOnDefault: false`', () => {
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
  it('supports a global clearOnDefault option', () => {
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
  it('gives precedence to parser clearOnDefault over global clearOnDefault', () => {
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
  it('supports urlKeys', () => {
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
  it('supports ? in the values', () => {
    const serialize = createSerializer(parsers)
    const result = serialize({ str: 'foo?bar', int: 1, bool: true })
    expect(result).toBe('?str=foo?bar&int=1&bool=true')
  })
  it('supports & in the base', () => {
    // Repro for https://github.com/47ng/nuqs/issues/812
    const serialize = createSerializer(parsers)
    const result = serialize('https://example.com/path?issue=is?here', {
      str: 'foo?bar'
    })
    expect(result).toBe('https://example.com/path?issue=is?here&str=foo?bar')
  })
  it('supports native array values', () => {
    const serialize = createSerializer(parsers)
    const result = serialize({ multi: ['a', 'b', 'c'] })
    expect(result).toBe('?multi=a&multi=b&multi=c')
  })
  it.each(['constructor', 'hasOwnProperty'])(
    'ignores an omitted parser key named %s',
    key => {
      const serialize = createSerializer({
        a: parseAsString,
        [key]: parseAsString
      })
      expect(serialize({ a: 'acme' })).toBe('?a=acme')
    }
  )
  describe('supports processUrlSearchParams', () => {
    it('modifies search params in place', () => {
      const serialize = createSerializer(parsers, {
        processUrlSearchParams: searchParams => {
          searchParams.set('processed', 'true')
          return searchParams
        }
      })
      const result = serialize({ str: 'foo' })
      expect(result).toBe('?str=foo&processed=true')
    })
    it('sorts the search params alphabetically', () => {
      const serialize = createSerializer(
        {
          // Note the order of keys here:
          z: parseAsInteger,
          a: parseAsInteger
        },
        {
          processUrlSearchParams: searchParams => {
            searchParams.sort()
            return searchParams
          }
        }
      )
      const result = serialize('?foo=bar', { a: 1, z: 1 })
      expect(result).toBe('?a=1&foo=bar&z=1')
    })
  })
  describe('hash preservation', () => {
    it('keeps the hash with a string base and existing search', () => {
      const serialize = createSerializer(parsers)
      const result = serialize('/path?a=1#section', {})
      expect(result).toBe('/path?a=1#section')
    })
    it('keeps the hash with a string base when adding a value', () => {
      const serialize = createSerializer(parsers)
      const result = serialize('/path#section', { str: 'foo' })
      expect(result).toBe('/path?str=foo#section')
    })
    it('keeps the hash with a URL base', () => {
      const serialize = createSerializer(parsers)
      const url = new URL('https://example.com/path#section')
      const result = serialize(url, { str: 'foo' })
      expect(result).toBe('https://example.com/path?str=foo#section')
    })
    it('keeps a hash containing a ? character intact', () => {
      const serialize = createSerializer(parsers)
      const result = serialize('/p#frag?x', {})
      expect(result).toBe('/p#frag?x')
    })
    it('keeps the hash when clearing all params with a global null', () => {
      const serialize = createSerializer(parsers)
      const result = serialize('/path?str=foo#section', null)
      expect(result).toBe('/path#section')
    })
    it('leaves paths without a hash unchanged', () => {
      const serialize = createSerializer(parsers)
      const result = serialize('/path', {})
      expect(result).toBe('/path')
    })
  })
})
