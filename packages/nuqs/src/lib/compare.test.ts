import { describe, expect, it } from 'vitest'
import { compareQuery } from './compare'

describe('compare', () => {
  describe('strings', () => {
    it('should return true for equal values', () => {
      expect(compareQuery('a', 'a')).toBe(true)
    })
    it('should return false for different strings', () => {
      expect(compareQuery('a', 'b')).toBe(false)
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
