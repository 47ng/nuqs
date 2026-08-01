import { describe, expect, it } from 'vitest'
import { createLoader } from './loader'
import {
  createParser,
  parseAsInteger,
  parseAsNativeArrayOf,
  parseAsString
} from './parsers'

describe('loader', () => {
  describe('sync', () => {
    it('parses a URL object', () => {
      const load = createLoader({
        a: parseAsInteger,
        b: parseAsInteger
      })
      const result = load(new URL('http://example.com/?a=1&b=2'))
      expect(result).toEqual({
        a: 1,
        b: 2
      })
    })
    it('parses a Request object', () => {
      const load = createLoader({
        a: parseAsInteger,
        b: parseAsInteger
      })
      const result = load(new Request('http://example.com/?a=1&b=2'))
      expect(result).toEqual({
        a: 1,
        b: 2
      })
    })
    it('parses a URLSearchParams object', () => {
      const load = createLoader({
        a: parseAsInteger,
        b: parseAsInteger
      })
      const result = load(new URLSearchParams('a=1&b=2'))
      expect(result).toEqual({
        a: 1,
        b: 2
      })
    })
    it('parses a Record<string, string | string[] | undefined> object', () => {
      const load = createLoader({
        a: parseAsInteger,
        b: parseAsInteger
      })
      const result = load({
        a: '1',
        b: '2'
      })
      expect(result).toEqual({
        a: 1,
        b: 2
      })
    })
    it('parses a URL string', () => {
      const load = createLoader({
        a: parseAsInteger,
        b: parseAsInteger
      })
      const result = load('https://example.com/?a=1&b=2')
      expect(result).toEqual({
        a: 1,
        b: 2
      })
    })
    it('parses a search params string', () => {
      const load = createLoader({
        a: parseAsInteger,
        b: parseAsInteger
      })
      const result = load('?a=1&b=2')
      expect(result).toEqual({
        a: 1,
        b: 2
      })
    })
    it('supports urlKeys', () => {
      const load = createLoader(
        {
          urlKey: parseAsInteger
        },
        {
          urlKeys: {
            urlKey: 'a'
          }
        }
      )
      const result = load('?a=1')
      expect(result).toEqual({
        urlKey: 1
      })
    })
    it('supports default values', () => {
      const load = createLoader({
        a: parseAsInteger,
        b: parseAsInteger.withDefault(2)
      })
      const result = load('')
      expect(result).toEqual({
        a: null,
        b: 2
      })
    })
    it('throws errors in strict mode when the parser returns null on non-empty queries', () => {
      const load = createLoader({
        test: createParser({
          parse: () => null,
          serialize: String
        })
      })
      expect(() => load('?test=will-be-null', { strict: true })).toThrow(
        '[nuqs] Failed to parse query `will-be-null` for key `test` (got null)'
      )
    })
    it('throws errors in strict mode when the parser rejects an empty query', () => {
      const load = createLoader({
        count: parseAsInteger
      })
      expect(() => load('?count=', { strict: true })).toThrow(
        '[nuqs] Failed to parse query `` for key `count` (got null)'
      )
    })
    it('throws errors in strict mode when the parser throws an error', () => {
      const load = createLoader({
        test: createParser({
          parse: (): any => {
            throw new Error('Boom')
          },
          serialize: String
        })
      })
      expect(() => load('?test=will-throw', { strict: true })).toThrow(
        '[nuqs] Error while parsing query `will-throw` for key `test`: Error: Boom'
      )
    })
  })

  describe('async', () => {
    it('parses a URL object', () => {
      const load = createLoader({
        a: parseAsInteger,
        b: parseAsInteger
      })
      const result = load(
        Promise.resolve(new URL('http://example.com/?a=1&b=2'))
      )
      return expect(result).resolves.toEqual({
        a: 1,
        b: 2
      })
    })
    it('parses a Request object', () => {
      const load = createLoader({
        a: parseAsInteger,
        b: parseAsInteger
      })
      const result = load(
        Promise.resolve(new Request('http://example.com/?a=1&b=2'))
      )
      return expect(result).resolves.toEqual({
        a: 1,
        b: 2
      })
    })
    it('parses a URLSearchParams object', () => {
      const load = createLoader({
        a: parseAsInteger,
        b: parseAsInteger
      })
      const result = load(Promise.resolve(new URLSearchParams('a=1&b=2')))
      return expect(result).resolves.toEqual({
        a: 1,
        b: 2
      })
    })
    it('parses a Record<string, string | string[] | undefined> object', () => {
      const load = createLoader({
        a: parseAsInteger,
        b: parseAsInteger
      })
      const result = load(
        Promise.resolve({
          a: '1',
          b: '2'
        })
      )
      return expect(result).resolves.toEqual({
        a: 1,
        b: 2
      })
    })
    it('parses a URL string', () => {
      const load = createLoader({
        a: parseAsInteger,
        b: parseAsInteger
      })
      const result = load(Promise.resolve('https://example.com/?a=1&b=2'))
      return expect(result).resolves.toEqual({
        a: 1,
        b: 2
      })
    })
    it('parses a search params string', () => {
      const load = createLoader({
        a: parseAsInteger,
        b: parseAsInteger
      })
      const result = load(Promise.resolve('?a=1&b=2'))
      return expect(result).resolves.toEqual({
        a: 1,
        b: 2
      })
    })
    it('supports urlKeys', () => {
      const load = createLoader(
        {
          urlKey: parseAsInteger
        },
        {
          urlKeys: {
            urlKey: 'a'
          }
        }
      )
      const result = load(Promise.resolve('?a=1'))
      return expect(result).resolves.toEqual({
        urlKey: 1
      })
    })
  })

  describe('required', () => {
    it('throws when a required param is missing from the URL and has no default', () => {
      const load = createLoader({
        count: parseAsInteger.withOptions({ required: true })
      })
      expect(() => load('')).toThrow(
        '[nuqs] Missing required query param `count`'
      )
    })
    it('does not throw when a required param is missing but has a default', () => {
      const load = createLoader({
        count: parseAsInteger.withOptions({ required: true }).withDefault(0)
      })
      const result = load('')
      expect(result).toEqual({ count: 0 })
    })
    it('does not throw when a required param is present and parses successfully', () => {
      const load = createLoader({
        count: parseAsInteger.withOptions({ required: true })
      })
      const result = load('?count=42')
      expect(result).toEqual({ count: 42 })
    })
    it('throws when a required param is present but fails to parse and has no default', () => {
      const load = createLoader({
        test: createParser({
          parse: () => null,
          serialize: String
        }).withOptions({ required: true })
      })
      expect(() => load('?test=will-be-null')).toThrow(
        '[nuqs] Missing required query param `test`'
      )
    })
    it('does not throw for non-required params that are missing or unparseable', () => {
      const load = createLoader({
        a: parseAsInteger,
        b: parseAsInteger.withOptions({ required: true })
      })
      const result = load('?b=1')
      expect(result).toEqual({ a: null, b: 1 })
    })
    it('strict error takes precedence over required when both apply', () => {
      const load = createLoader({
        test: createParser({
          parse: () => null,
          serialize: String
        }).withOptions({ required: true })
      })
      expect(() => load('?test=will-be-null', { strict: true })).toThrow(
        '[nuqs] Failed to parse query `will-be-null` for key `test` (got null)'
      )
    })
  })

  describe('multi-parser', () => {
    it('supports multi-parsers', () => {
      const load = createLoader({
        a: parseAsNativeArrayOf(parseAsInteger)
      })
      const result = load(new Request('http://example.com/?a=1&a=2&a=3'))
      expect(result).toStrictEqual({ a: [1, 2, 3] })
    })

    it('removes un-parseable values', () => {
      const load = createLoader({
        a: parseAsNativeArrayOf(parseAsInteger)
      })
      const result = load(new Request('http://example.com/?a=foo&a=1'))
      expect(result).toStrictEqual({ a: [1] })
    })
    it('defaults if everything is unparseable', () => {
      const load = createLoader({
        a: parseAsNativeArrayOf(parseAsInteger).withDefault([42])
      })
      const result = load(new Request('http://example.com/?a=foo&a=bar'))
      expect(result).toStrictEqual({ a: [42] })
    })
  })
})
