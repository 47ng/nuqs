import { describe, expect, it, vi } from 'vitest'
import { getSearchParams } from './patch-history'

describe('patch-history/getSearchParams', () => {
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
