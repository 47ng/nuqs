import { describe, expect, it } from 'vitest'
import { extractDynamicUrlParams, getAsPathPathname } from './impl.pages'

describe('Next Pages Adapter: getAsPathPathname', () => {
  it('returns a pure pathname', () => {
    expect(getAsPathPathname('')).toBe('')
    expect(getAsPathPathname('/')).toBe('/')
    expect(getAsPathPathname('/a/b/c')).toBe('/a/b/c')
  })
  it('strips search params', () => {
    expect(getAsPathPathname('/a/b/c?foo=bar')).toBe('/a/b/c')
    expect(getAsPathPathname('/a/b/c?foo=bar&baz=qux')).toBe('/a/b/c')
  })
  it('strips hash', () => {
    expect(getAsPathPathname('/a/b/c#foo')).toBe('/a/b/c')
    expect(getAsPathPathname('/a/b/c#foo/bar')).toBe('/a/b/c')
  })
  it('strips both search params and hash', () => {
    expect(getAsPathPathname('/a/b/c?foo=bar#baz')).toBe('/a/b/c')
    expect(getAsPathPathname('/a/b/c?foo=bar&baz=qux#quux')).toBe('/a/b/c')
  })
})

describe('Next Pages Adapter: extractDynamicUrlParams', () => {
  it('returns an empty object when no dynamic params are present', () => {
    const result = extractDynamicUrlParams('/path/without/params', {
      ignored: 'gone' // ignored
    })
    expect(result).toEqual({})
  })

  it('returns an object with dynamic params', () => {
    const result = extractDynamicUrlParams('/path/[foo]/[bar]', {
      foo: 'bar',
      bar: 'baz',
      ignored: 'gone'
    })
    expect(result).toEqual({ foo: 'bar', bar: 'baz' })
  })

  it('maps missing dynamic params to undefined', () => {
    const result = extractDynamicUrlParams('/path/[foo]/[bar]', {
      bar: 'baz' // foo is missing
    })
    expect(result).toEqual({ foo: undefined, bar: 'baz' })
  })

  // --

  it('returns an array for catch-all params', () => {
    const result = extractDynamicUrlParams('/path/[...params]', {
      params: ['foo', 'bar'],
      ignored: 'gone'
    })
    expect(result).toEqual({ params: ['foo', 'bar'] })
  })

  // --

  it('returns an empty array for optional catch-all params without values', () => {
    const result = extractDynamicUrlParams('/path/[[...params]]', {
      ignored: 'gone'
    })
    expect(result).toEqual({ params: [] })
  })

  it('returns an array with a single item for optional catch-all params with a single value', () => {
    const result = extractDynamicUrlParams('/path/[[...params]]', {
      params: ['foo'],
      ignored: 'gone'
    })
    expect(result).toEqual({ params: ['foo'] })
  })

  it('returns an array with multiple items for optional catch-all params with multiple values', () => {
    const result = extractDynamicUrlParams('/path/[[...params]]', {
      params: ['foo', 'bar'],
      ignored: 'gone'
    })
    expect(result).toEqual({ params: ['foo', 'bar'] })
  })

  // --

  it('supports a combination of dynamic and catch-all params', () => {
    const result = extractDynamicUrlParams('/path/[foo]/[bar]/[...params]', {
      foo: 'a',
      bar: 'b',
      params: ['baz'],
      ignored: 'gone'
    })
    expect(result).toEqual({ foo: 'a', bar: 'b', params: ['baz'] })
  })

  it('supports a combination of dynamic and optional catch-all params', () => {
    const result = extractDynamicUrlParams('/path/[foo]/[bar]/[[...params]]', {
      foo: 'a',
      bar: 'b',
      params: ['baz'],
      ignored: 'gone'
    })
    expect(result).toEqual({ foo: 'a', bar: 'b', params: ['baz'] })
  })
})
