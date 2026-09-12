import { describe, expect, it } from 'vitest'
import { applyChange, filterSearchParams } from './key-isolation'

describe('applyChange', () => {
  it('returns the same instance when watched keys are unchanged', () => {
    const oldValue = new URLSearchParams('keep=5&other=1')
    const newValue = new URLSearchParams('keep=5&other=2')
    const result = applyChange(newValue, ['keep'], false)(oldValue)
    expect(result).toBe(oldValue)
  })

  it('returns the filtered new value when watched keys changed', () => {
    const oldValue = new URLSearchParams('keep=5')
    const newValue = new URLSearchParams('a=1&b=2&c=3&d=4&keep=6&e=6')
    const result = applyChange(newValue, ['keep'], false)(oldValue)
    expect(result.toString()).toBe('keep=6')
  })
})

describe('filterSearchParams', () => {
  it('removes unwatched keys without leaking entries past a deleted key', () => {
    const search = new URLSearchParams('a=1&b=2&c=3&d=4&keep=5&e=6')
    const filtered = filterSearchParams(search, ['keep'], false)
    expect(filtered.toString()).toBe('keep=5')
  })

  it('leaves the original untouched when copying', () => {
    const search = new URLSearchParams('a=1&b=2&c=3&d=4&keep=5&e=6')
    const filtered = filterSearchParams(search, ['keep'], true)
    expect(filtered.toString()).toBe('keep=5')
    expect(search.toString()).toBe('a=1&b=2&c=3&d=4&keep=5&e=6')
  })

  it.each([false, true])(
    'returns the same instance untouched when no keys are watched (copy: %s)',
    copy => {
      const search = new URLSearchParams('a=1&b=2')
      const filtered = filterSearchParams(search, [], copy)
      expect(filtered).toBe(search)
      expect(filtered.toString()).toBe('a=1&b=2')
    }
  )

  it('keeps all values of a multi-value watched key and drops unwatched ones', () => {
    const search = new URLSearchParams('tag=a&x=1&tag=b')
    const filtered = filterSearchParams(search, ['tag'], false)
    expect(filtered.getAll('tag')).toEqual(['a', 'b'])
    expect(filtered.has('x')).toBe(false)
  })
})
