import { describe, expect, it } from 'vitest'
import type { Query } from './search-params'
import { compareArrays, compareQuery } from './compare'

describe('compare', () => {
  it('short-circuits array comparison for the same reference', () => {
    const values = ['a']
    let comparisons = 0

    expect(
      compareArrays(values, values, () => {
        comparisons++
        return false
      })
    ).toBe(true)
    expect(comparisons).toBe(0)
  })

  describe('strings', () => {
    it('should return true for equal values', () => {
      expect(compareQuery('a', 'a')).toBe(true)
    })
    it('should return false for different strings', () => {
      expect(compareQuery('a', 'b')).toBe(false)
    })
    it('should return false when compared with an array', () => {
      expect(compareQuery<Query>('a', ['a'])).toBe(false)
      expect(compareQuery<Query>(['a'], 'a')).toBe(false)
    })
  })
  describe('nullable queries', () => {
    it('should compare null only with null', () => {
      expect(compareQuery(null, null)).toBe(true)
      expect(compareQuery(null, 'a')).toBe(false)
      expect(compareQuery('a', null)).toBe(false)
      expect(compareQuery(null, ['a'])).toBe(false)
      expect(compareQuery(['a'], null)).toBe(false)
      expect(compareQuery(null, [])).toBe(false)
      expect(compareQuery([], null)).toBe(false)
    })
  })
  describe('arrays', () => {
    it('should return true for equal arrays', () => {
      expect(compareQuery(['a', 'b'], ['a', 'b'])).toBe(true)
    })
    it('should return true for same array instance', () => {
      const arr = ['a', 'b']
      expect(compareQuery(arr, arr)).toBe(true)
    })
    it('should return false for different arrays', () => {
      expect(compareQuery(['a', 'b'], ['a', 'c'])).toBe(false)
    })
    it('should return false for different length arrays', () => {
      expect(compareQuery(['a', 'b'], ['a', 'b', 'c'])).toBe(false)
    })
  })
})
