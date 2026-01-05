import { describe, expect, it } from 'vitest'
import {
  constructHash,
  getPathnameFromHash,
  getSearchFromHash
} from './hash-router-utils'

describe('hash-router-utils', () => {
  describe('getSearchFromHash', () => {
    it('extracts search string from hash with pathname and search', () => {
      expect(getSearchFromHash('#/page?foo=bar')).toBe('?foo=bar')
    })

    it('returns empty string when hash has no search params', () => {
      expect(getSearchFromHash('#/page')).toBe('')
    })

    it('returns empty string for empty hash', () => {
      expect(getSearchFromHash('')).toBe('')
    })

    it('returns empty string for hash with only #', () => {
      expect(getSearchFromHash('#')).toBe('')
    })

    it('handles hash without leading #', () => {
      expect(getSearchFromHash('/page?foo=bar')).toBe('?foo=bar')
    })

    it('handles search params at root', () => {
      expect(getSearchFromHash('#?foo=bar')).toBe('?foo=bar')
    })

    it('handles multiple query params', () => {
      expect(getSearchFromHash('#/page?foo=bar&baz=qux')).toBe(
        '?foo=bar&baz=qux'
      )
    })

    it('handles nested paths', () => {
      expect(getSearchFromHash('#/deep/nested/path?key=value')).toBe(
        '?key=value'
      )
    })

    it('preserves everything after the first ?', () => {
      expect(getSearchFromHash('#/page?foo=bar?baz=qux')).toBe(
        '?foo=bar?baz=qux'
      )
    })
  })

  describe('getPathnameFromHash', () => {
    it('extracts pathname from hash with pathname and search', () => {
      expect(getPathnameFromHash('#/page?foo=bar')).toBe('/page')
    })

    it('returns pathname when hash has no search params', () => {
      expect(getPathnameFromHash('#/page')).toBe('/page')
    })

    it('returns empty string for empty hash', () => {
      expect(getPathnameFromHash('')).toBe('')
    })

    it('returns empty string for hash with only #', () => {
      expect(getPathnameFromHash('#')).toBe('')
    })

    it('handles hash without leading #', () => {
      expect(getPathnameFromHash('/page?foo=bar')).toBe('/page')
    })

    it('returns root path for root hash', () => {
      expect(getPathnameFromHash('#/')).toBe('/')
    })

    it('returns empty string when search params at root', () => {
      expect(getPathnameFromHash('#?foo=bar')).toBe('')
    })

    it('handles nested paths', () => {
      expect(getPathnameFromHash('#/deep/nested/path?key=value')).toBe(
        '/deep/nested/path'
      )
    })
  })

  describe('constructHash', () => {
    it('constructs hash from pathname and search', () => {
      expect(constructHash('/page', '?foo=bar')).toBe('#/page?foo=bar')
    })

    it('constructs hash from pathname without search', () => {
      expect(constructHash('/page', '')).toBe('#/page')
    })

    it('constructs hash with only search params', () => {
      expect(constructHash('', '?foo=bar')).toBe('#?foo=bar')
    })

    it('constructs empty hash', () => {
      expect(constructHash('', '')).toBe('#')
    })

    it('handles root pathname with search', () => {
      expect(constructHash('/', '?foo=bar')).toBe('#/?foo=bar')
    })

    it('handles nested paths', () => {
      expect(constructHash('/deep/nested/path', '?key=value')).toBe(
        '#/deep/nested/path?key=value'
      )
    })
  })

  describe('roundtrip', () => {
    it('can roundtrip pathname and search through construct and extract', () => {
      const pathname = '/page'
      const search = '?foo=bar'
      const hash = constructHash(pathname, search)
      expect(getPathnameFromHash(hash)).toBe(pathname)
      expect(getSearchFromHash(hash)).toBe(search)
    })

    it('can roundtrip complex pathname and search', () => {
      const pathname = '/deep/nested/path'
      const search = '?foo=bar&baz=qux'
      const hash = constructHash(pathname, search)
      expect(getPathnameFromHash(hash)).toBe(pathname)
      expect(getSearchFromHash(hash)).toBe(search)
    })

    it('can roundtrip empty pathname with search', () => {
      const pathname = ''
      const search = '?foo=bar'
      const hash = constructHash(pathname, search)
      expect(getPathnameFromHash(hash)).toBe(pathname)
      expect(getSearchFromHash(hash)).toBe(search)
    })

    it('can roundtrip pathname without search', () => {
      const pathname = '/page'
      const search = ''
      const hash = constructHash(pathname, search)
      expect(getPathnameFromHash(hash)).toBe(pathname)
      expect(getSearchFromHash(hash)).toBe(search)
    })
  })
})
