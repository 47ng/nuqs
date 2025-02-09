import { describe, expect, it, vi } from 'vitest'
import { DebouncedPromiseQueue } from './debounce'

describe('queues: DebouncedPromiseQueue', () => {
  it('creates a queue for a given key', () => {
    vi.useFakeTimers()
    const spy = vi.fn().mockResolvedValue('output')
    const queue = new DebouncedPromiseQueue(spy)
    queue.push('value', 100)
    vi.advanceTimersToNextTimer()
    expect(spy).toHaveBeenCalledExactlyOnceWith('value')
  })
  it('debounces the queue', () => {
    vi.useFakeTimers()
    const spy = vi.fn().mockResolvedValue('output')
    const queue = new DebouncedPromiseQueue(spy)
    queue.push('a', 100)
    queue.push('b', 100)
    queue.push('c', 100)
    vi.advanceTimersToNextTimer()
    expect(spy).toHaveBeenCalledExactlyOnceWith('c')
  })
  it('returns a stable promise to the next time the callback is called', async () => {
    vi.useFakeTimers()
    const queue = new DebouncedPromiseQueue(() => Promise.resolve('output'))
    const p1 = queue.push('value', 100)
    const p2 = queue.push('value', 100)
    expect(p1).toBe(p2)
    vi.advanceTimersToNextTimer()
    await expect(p1).resolves.toBe('output')
  })
  it('returns a new Promise once the callback is called', async () => {
    vi.useFakeTimers()
    let count = 0
    const queue = new DebouncedPromiseQueue(() => Promise.resolve(count++))
    const p1 = queue.push('value', 100)
    vi.advanceTimersToNextTimer()
    await expect(p1).resolves.toBe(0)
    const p2 = queue.push('value', 100)
    expect(p2).not.toBe(p1)
    vi.advanceTimersToNextTimer()
    await expect(p2).resolves.toBe(1)
  })
})
