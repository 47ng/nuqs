import { describe, expect, it } from 'vitest'
import { ThrottledQueue } from './throttle'

describe('throttle: shared rate-limit budget', () => {
  it('shares lastFlushedAt across queue instances via history.nuqs', () => {
    const a = new ThrottledQueue()
    const b = new ThrottledQueue()
    a.lastFlushedAt = 12_345
    expect(b.lastFlushedAt).toBe(12_345)
    expect(history.nuqs?.lastFlushedAt).toBe(12_345)
  })
})
