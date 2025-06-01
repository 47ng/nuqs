import { describe, expect, it, vi } from 'vitest'
import { compose } from './compose'

describe('queues: compose', () => {
  it('handles an empty array', () => {
    const final = vi.fn()
    compose([], final)
    expect(final).toHaveBeenCalledOnce()
  })
  it('handles one item, calling it before the final', () => {
    const a = vi
      .fn()
      .mockImplementation(x => x())
      .mockName('a')
    const final = vi.fn()
    compose([a], final)
    expect(a).toHaveBeenCalledOnce()
    expect(final).toHaveBeenCalledOnce()
    expect(a.mock.invocationCallOrder[0]).toBeLessThan(
      final.mock.invocationCallOrder[0]!
    )
  })
  it('composes several items, calling them in order', () => {
    const a = vi.fn().mockImplementation(x => x())
    const b = vi.fn().mockImplementation(x => x())
    const c = vi.fn().mockImplementation(x => x())
    const final = vi.fn()
    compose([a, b, c], final)
    expect(a).toHaveBeenCalledOnce()
    expect(b).toHaveBeenCalledOnce()
    expect(c).toHaveBeenCalledOnce()
    expect(final).toHaveBeenCalledOnce()
    expect(a.mock.invocationCallOrder[0]).toBeLessThan(
      b.mock.invocationCallOrder[0]!
    )
    expect(b.mock.invocationCallOrder[0]).toBeLessThan(
      c.mock.invocationCallOrder[0]!
    )
    expect(c.mock.invocationCallOrder[0]).toBeLessThan(
      final.mock.invocationCallOrder[0]!
    )
  })
})
