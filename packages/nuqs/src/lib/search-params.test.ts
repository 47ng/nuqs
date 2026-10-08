import { describe, expect, it } from 'vitest'
import { getSearchParams } from './search-params'

describe('search-params/getSearchParams (environment-independent)', () => {
  it('reads the search params of a URL object', () => {
    const url = new URL('https://example.com/?a=1')
    expect(getSearchParams(url)).toBe(url.searchParams)
  })
  it('reads a search string', () => {
    expect(getSearchParams('?a=1').get('a')).toBe('1')
  })
  it('ignores the hash of a search string', () => {
    expect(getSearchParams('?a=1#hash').get('a')).toBe('1')
  })
})
