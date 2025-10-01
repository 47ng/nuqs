import { describe, expect, it, vi } from 'vitest'
import { getSearchParams, isAbsentFromUrl, write } from './search-params'

describe('search-params/isAbsentFromUrl', () => {
  it('returns true for null', () => {
    expect(isAbsentFromUrl(null)).toBe(true)
  })
  it('returns true for empty array', () => {
    expect(isAbsentFromUrl([])).toBe(true)
  })
  it('returns false for string', () => {
    expect(isAbsentFromUrl('a')).toBe(false)
  })
  it('returns false for non-empty array', () => {
    expect(isAbsentFromUrl(['a'])).toBe(false)
  })
})

describe('search-params/write', () => {
  it('writes a string value', () => {
    const params = new URLSearchParams('key=init')
    const received = write(params, 'key', 'foo')
    const expected = new URLSearchParams('key=foo')
    expect(received).toEqual(expected)
  })
  it('writes an array of values', () => {
    const params = new URLSearchParams('key=init')
    const received = write(params, 'key', ['foo', 'bar'])
    const expected = new URLSearchParams('key=foo&key=bar')
    expect(received).toEqual(expected)
  })
  it('writes an empty array as an empty value', () => {
    const params = new URLSearchParams('key=init')
    const received = write(params, 'key', [])
    const expected = new URLSearchParams('key=')
    expect(received).toEqual(expected)
  })
  it('writes an empty array as an empty value when the key is not present', () => {
    const params = new URLSearchParams()
    const received = write(params, 'key', [])
    const expected = new URLSearchParams('key=')
    expect(received).toEqual(expected)
  })
})

describe('search-params/getSearchParams', () => {
  it('extracts search params from a URL object', () => {
    const received = getSearchParams(new URL('http://example.com/?foo=bar'))
    const expected = new URLSearchParams('?foo=bar')
    expect(received).toEqual(expected)
  })
  it('extracts search params from a fully-qualified URL string', () => {
    const received = getSearchParams('http://example.com/?foo=bar')
    const expected = new URLSearchParams('?foo=bar')
    expect(received).toEqual(expected)
  })
  it('extracts search params from a pathname', () => {
    vi.stubGlobal('location', { origin: 'http://example.com' })
    const received = getSearchParams('/?foo=bar')
    const expected = new URLSearchParams('?foo=bar')
    expect(received).toEqual(expected)
  })
  it('extracts search params from a query string', () => {
    const received = getSearchParams('?foo=bar')
    const expected = new URLSearchParams('?foo=bar')
    expect(received).toEqual(expected)
  })
  it('falls back to an empty search params object for invalid inputs', () => {
    const received = getSearchParams('invalid')
    const expected = new URLSearchParams()
    expect(received).toEqual(expected)
  })
})
