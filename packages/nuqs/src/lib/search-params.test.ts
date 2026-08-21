import { describe, expect, it } from 'vitest'
import { isAbsentFromUrl } from './search-params'

describe('search params', () => {
  it('treats only null and empty arrays as absent', () => {
    expect(isAbsentFromUrl(null)).toBe(true)
    expect(isAbsentFromUrl([])).toBe(true)
    expect(isAbsentFromUrl([''])).toBe(false)
    expect(isAbsentFromUrl(['value'])).toBe(false)
  })
})
