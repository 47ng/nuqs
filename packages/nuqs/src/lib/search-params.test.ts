import { describe, expect, it } from 'vitest'
import { getSearchParams } from './search-params'

describe('search-params/getSearchParams in Node', () => {
  it('reads search params from a URL object', () => {
    expect(
      getSearchParams(new URL('https://example.com/path?foo=bar')).toString()
    ).toBe('foo=bar')
  })

  it('reads a query-only string', () => {
    expect(getSearchParams('?foo=bar').toString()).toBe('foo=bar')
  })

  it('ignores fragments in query-only strings', () => {
    expect(getSearchParams('?foo=bar#ignored=value').toString()).toBe('foo=bar')
  })
})
