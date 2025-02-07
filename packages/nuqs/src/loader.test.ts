import { describe, expect, it } from 'vitest'
import { createLoader } from './loader'
import { parseAsInteger } from './parsers'

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
})
