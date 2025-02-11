import { afterEach, describe, expect, it, vi } from 'vitest'
import type { UpdateUrlFunction } from '../../adapters/lib/defs'
import { defaultRateLimit } from './rate-limiting'
import { ThrottledQueue, type UpdateQueueAdapterContext } from './throttle'

const mockAdapter = {
  updateUrl: vi.fn<UpdateUrlFunction>(),
  getSearchParamsSnapshot() {
    return new URLSearchParams()
  }
} satisfies UpdateQueueAdapterContext

afterEach(() => {
  mockAdapter.updateUrl.mockReset()
})

describe('throttle: ThrottleQueue value queueing', () => {
  it('should enqueue key & values', () => {
    const queue = new ThrottledQueue()
    queue.push({ key: 'key', query: 'value', options: {} })
    expect(queue.getQueuedQuery('key')).toEqual('value')
  })
  it('should replace more recent values with the same key', () => {
    const queue = new ThrottledQueue()
    queue.push({ key: 'key', query: 'a', options: {} })
    queue.push({ key: 'key', query: 'b', options: {} })
    expect(queue.getQueuedQuery('key')).toEqual('b')
  })
  it('should enqueue multiple keys', () => {
    const queue = new ThrottledQueue()
    queue.push({ key: 'key1', query: 'a', options: {} })
    queue.push({ key: 'key2', query: 'b', options: {} })
    expect(queue.getQueuedQuery('key1')).toEqual('a')
    expect(queue.getQueuedQuery('key2')).toEqual('b')
  })
  it('should enqueue null values (to clear a key from the URL)', () => {
    const queue = new ThrottledQueue()
    queue.push({ key: 'key', query: 'a', options: {} })
    queue.push({ key: 'key', query: null, options: {} })
    expect(queue.getQueuedQuery('key')).toBeNull()
  })
  it('should return an undefined queued value if no push occurred', () => {
    const queue = new ThrottledQueue()
    expect(queue.getQueuedQuery('key')).toBeUndefined()
  })
})

describe('throttle: ThrottleQueue option combination logic', () => {
  it('should resolve with the default options', () => {
    const queue = new ThrottledQueue()
    expect(queue.options).toEqual({
      history: 'replace',
      scroll: false,
      shallow: true
    })
  })
  it('should combine history options (push takes precedence)', () => {
    const queue = new ThrottledQueue()
    queue.push({ key: 'a', query: null, options: { history: 'replace' } })
    queue.push({ key: 'b', query: null, options: { history: 'push' } })
    queue.push({ key: 'c', query: null, options: { history: 'replace' } })
    expect(queue.options.history).toEqual('push')
  })
  it('should combine scroll options (true takes precedence)', () => {
    const queue = new ThrottledQueue()
    queue.push({ key: 'a', query: null, options: { scroll: false } })
    queue.push({ key: 'b', query: null, options: { scroll: true } })
    queue.push({ key: 'c', query: null, options: { scroll: false } })
    expect(queue.options.scroll).toEqual(true)
  })
  it('should combine shallow options (false takes precedence)', () => {
    const queue = new ThrottledQueue()
    queue.push({ key: 'a', query: null, options: { shallow: true } })
    queue.push({ key: 'b', query: null, options: { shallow: false } })
    queue.push({ key: 'c', query: null, options: { shallow: true } })
    expect(queue.options.shallow).toEqual(false)
  })
  it('should compose transitions', async () => {
    const mockStartTransition = (callback: () => void) => {
      callback()
    }
    const startTransitionA = vi.fn().mockImplementation(mockStartTransition)
    const startTransitionB = vi.fn().mockImplementation(mockStartTransition)
    const queue = new ThrottledQueue()
    queue.push({
      key: 'a',
      query: null,
      options: { startTransition: startTransitionA }
    })
    queue.push({
      key: 'b',
      query: null,
      options: { startTransition: startTransitionB }
    })
    await queue.flush(mockAdapter)
    expect(startTransitionA).toHaveBeenCalledOnce()
    expect(startTransitionB).toHaveBeenCalledOnce()
    expect(startTransitionA).toHaveBeenCalledBefore(startTransitionB)
  })
  it('keeps the maximum value for timeMs', () => {
    const queue = new ThrottledQueue()
    queue.push({ key: 'a', query: null, options: {} }, 100)
    queue.push({ key: 'b', query: null, options: {} }, 200)
    queue.push({ key: 'c', query: null, options: {} }, 300)
    expect(queue.timeMs).toEqual(300)
  })
  it('clamps the minimum value for timeMs to the default rate limit', () => {
    expect(defaultRateLimit.timeMs).toBeGreaterThan(10) // precondition
    const queue = new ThrottledQueue()
    queue.push({ key: 'a', query: null, options: {} }, 10)
    expect(queue.timeMs).toEqual(defaultRateLimit.timeMs)
  })
  it('supports passing Infinity to the timeMs option (but can be cleared)', () => {
    const queue = new ThrottledQueue()
    queue.push({ key: 'a', query: null, options: {} }, Infinity)
    expect(queue.timeMs).toBe(Infinity)
    queue.push({ key: 'b', query: null, options: {} }, 100)
    expect(queue.timeMs).toBe(100)
  })
})

describe('throttle: flush', () => {
  it('returns a Promise of updated URL search params', async () => {
    const throttle = new ThrottledQueue()
    throttle.push({ key: 'a', query: 'a', options: {} })
    const promise = throttle.flush(mockAdapter)
    await expect(promise).resolves.toEqual(new URLSearchParams('?a=a'))
    expect(mockAdapter.updateUrl).toHaveBeenCalledExactlyOnceWith(
      new URLSearchParams('?a=a'),
      {
        history: 'replace',
        scroll: false,
        shallow: true
      }
    )
  })
  it('combines updates in order of push', async () => {
    const throttle = new ThrottledQueue()
    throttle.push({ key: 'b', query: 'b', options: {} })
    throttle.push({ key: 'a', query: 'a', options: {} })
    const promise = throttle.flush(mockAdapter)
    await expect(promise).resolves.toEqual(new URLSearchParams('?b=b&a=a'))
    expect(mockAdapter.updateUrl).toHaveBeenCalledExactlyOnceWith(
      new URLSearchParams('?b=b&a=a'),
      {
        history: 'replace',
        scroll: false,
        shallow: true
      }
    )
  })
  it('returns the same Promise for multiple flushes in the same tick', () => {
    vi.useFakeTimers()
    const throttle = new ThrottledQueue()
    throttle.push({ key: 'b', query: 'b', options: {} })
    const p1 = throttle.flush(mockAdapter)
    throttle.push({ key: 'a', query: 'a', options: {} })
    const p2 = throttle.flush(mockAdapter)
    expect(p1).toBe(p2)
    vi.runAllTimers()
    expect(mockAdapter.updateUrl).toHaveBeenCalledExactlyOnceWith(
      new URLSearchParams('?b=b&a=a'),
      {
        history: 'replace',
        scroll: false,
        shallow: true
      }
    )
  })
  it('returns the same Promise if the initial flush has no updates', () => {
    vi.useFakeTimers()
    const throttle = new ThrottledQueue()
    const p1 = throttle.flush(mockAdapter)
    throttle.push({ key: 'a', query: 'a', options: {} })
    const p2 = throttle.flush(mockAdapter)
    expect(p1).toBe(p2)
    vi.runAllTimers()
    expect(mockAdapter.updateUrl).toHaveBeenCalledExactlyOnceWith(
      new URLSearchParams('?a=a'),
      {
        history: 'replace',
        scroll: false,
        shallow: true
      }
    )
  })
  it('returns the same Promise if the second flush has no updates', () => {
    vi.useFakeTimers()
    const throttle = new ThrottledQueue()
    throttle.push({ key: 'a', query: 'a', options: {} })
    const p1 = throttle.flush(mockAdapter)
    const p2 = throttle.flush(mockAdapter)
    expect(p1).toBe(p2)
    vi.runAllTimers()
    expect(mockAdapter.updateUrl).toHaveBeenCalledExactlyOnceWith(
      new URLSearchParams('?a=a'),
      {
        history: 'replace',
        scroll: false,
        shallow: true
      }
    )
  })
})
