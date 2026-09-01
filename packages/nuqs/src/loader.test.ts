import { describe, expect, it } from 'vitest'
import { createLoader } from './loader'
import {
  createMultiParser,
  createParser,
  parseAsInteger,
  parseAsNativeArrayOf,
  parseAsString
} from './parsers'
import { createSerializer } from './serializer'

describe('loader', () => {
  describe('sync', () => {
    it.each(['constructor', 'hasOwnProperty'])(
      'supports the object prototype key %s',
      key => {
        const parsers = { [key]: parseAsString }
        const serialize = createSerializer(parsers)
        const load = createLoader(parsers)

        expect(serialize({ [key]: 'acme' })).toBe(`?${key}=acme`)
        expect(load(`?${key}=acme`)).toEqual({ [key]: 'acme' })

        const urlKeys = { [key]: 'alias' }
        const serializeAlias = createSerializer(parsers, { urlKeys })
        const loadAlias = createLoader(parsers, { urlKeys })
        expect(serializeAlias({ [key]: 'ajax' })).toBe('?alias=ajax')
        expect(loadAlias('?alias=ajax')).toEqual({ [key]: 'ajax' })

        const inheritedUrlKeys: Record<string, string> = Object.create({
          [key]: 'alias'
        })
        const loadInheritedAlias = createLoader(parsers, {
          urlKeys: inheritedUrlKeys
        })
        expect(loadInheritedAlias(`?${key}=acme&alias=ajax`)).toEqual({
          [key]: 'acme'
        })
      }
    )
    it('round-trips an explicit empty native array', () => {
      const parser = parseAsNativeArrayOf(parseAsInteger).withDefault([42])
      const serialize = createSerializer({ a: parser })
      const load = createLoader({ a: parser })

      const query = serialize({ a: [] })
      expect(query).toBe('?a=')
      expect(load(query)).toEqual({ a: [] })
    })
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
    it('preserves repeated values from record inputs', () => {
      const load = createLoader({
        a: parseAsNativeArrayOf(parseAsInteger)
      })
      expect(load({ a: ['1', '2'] })).toStrictEqual({ a: [1, 2] })
    })
    it('distinguishes absent and present native-array values', () => {
      const load = createLoader({
        a: createMultiParser({
          parse: values => (values.length === 0 ? ['parsed-empty'] : values),
          serialize: values => [...values]
        }).withDefault(['fallback'])
      })

      expect(load({ a: [] })).toStrictEqual({ a: ['fallback'] })
      expect(load({ a: [''] })).toStrictEqual({ a: [''] })
      expect(load({ a: ['one', 'two'] })).toStrictEqual({ a: ['one', 'two'] })
    })
    it('treats undefined record values as absent', () => {
      const load = createLoader({
        q: parseAsString.withDefault('fallback')
      })
      expect(load({ q: undefined })).toEqual({ q: 'fallback' })
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
    it('falls back to the default when a parser throws outside strict mode', () => {
      const parser = createParser({
        parse: () => {
          throw new Error('Boom')
        },
        serialize: String
      }).withDefault('fallback')
      expect(createLoader({ value: parser })('?value=x')).toEqual({
        value: 'fallback'
      })
    })
  })

  describe('async', () => {
    it('preserves strict mode for promised inputs', async () => {
      const load = createLoader({
        count: parseAsInteger.withDefault(0)
      })
      await expect(
        load(Promise.resolve('?count=invalid'), { strict: true })
      ).rejects.toThrow(
        '[nuqs] Failed to parse query `invalid` for key `count` (got null)'
      )
      await expect(
        load(Promise.resolve('?count=1'), { strict: true })
      ).resolves.toEqual({ count: 1 })
    })
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
