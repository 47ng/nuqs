import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { UpdateUrlFunction } from '../../adapters/lib/defs'
import { defaultRateLimit } from './rate-limiting'
import { ThrottledQueue, type UpdateQueueAdapterContext } from './throttle'

function createMockAdapter(): UpdateQueueAdapterContext {
  return {
    updateUrl: vi.fn<UpdateUrlFunction>(),
    getSearchParamsSnapshot() {
      return new URLSearchParams()
    }
  }
}

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
    const mockAdapter = createMockAdapter()
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

describe('throttle: Abort & reset logic', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })
  it('creates the abort controller lazily', async () => {
    const queue = new ThrottledQueue()
    const mockAdapter = createMockAdapter()
    expect(queue.controller).toBeNull()
    queue.push({ key: 'a', query: 'a', options: {} })
    expect(queue.controller).toBeNull()
    const promise = queue.flush(mockAdapter) // AbortController created on flush
    expect(queue.controller).not.toBeNull()
    vi.runAllTimers()
    await expect(promise).resolves.toEqual(new URLSearchParams('?a=a'))
  })
  it('does not abort pending flushes when resetting', async () => {
    const queue = new ThrottledQueue()
    const mockAdapter = createMockAdapter()
    queue.push({ key: 'a', query: 'a', options: {} })
    expect(queue.resolvers?.promise).toBeUndefined()
    const promise = queue.flush(mockAdapter)
    const controller = queue.controller!
    controller.signal.throwIfAborted()
    expect(queue.resolvers!.promise).toBe(promise)
    const abortedKeys = queue.reset()
    expect(abortedKeys).toEqual(['a'])
    // The promise should exist and be pending
    expect(queue.resolvers!.promise).toBe(promise)
    expect(queue.controller).toBe(controller)
    vi.runAllTimers()
    await expect(promise).resolves.toEqual(new URLSearchParams(''))
    expect(mockAdapter.updateUrl).not.toHaveBeenCalled()
    expect(queue.resolvers).toBeNull()
  })
  it('does reset when aborting', async () => {
    const queue = new ThrottledQueue()
    const controller = queue.controller
    const mockAdapter = createMockAdapter()
    queue.push({ key: 'a', query: 'a', options: {} })
    const promise = queue.flush(mockAdapter)
    const abortedKeys = queue.abort()
    expect(abortedKeys).toEqual(['a'])
    vi.runAllTimers()
    expect(mockAdapter.updateUrl).not.toHaveBeenCalled()
    expect(queue.updateMap.size).toBe(0)
    expect(queue.resolvers).toBeNull()
    expect(queue.controller).not.toBe(controller) // Reassigned after abort
    await expect(promise).resolves.toEqual(new URLSearchParams(''))
  })
})

describe('throttle: flush', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns a Promise of the current search params if flushed without updates', async () => {
    const throttle = new ThrottledQueue()
    const mockAdapter = createMockAdapter()
    const promise = throttle.flush(mockAdapter)
    vi.runAllTimers()
    await expect(promise).resolves.toEqual(new URLSearchParams())
    expect(mockAdapter.updateUrl).not.toHaveBeenCalled()
  })

  it('returns a Promise of updated URL search params', async () => {
    const throttle = new ThrottledQueue()
    const mockAdapter = createMockAdapter()
    throttle.push({ key: 'a', query: 'a', options: {} })
    const promise = throttle.flush(mockAdapter)
    vi.runAllTimers()
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
    const mockAdapter = createMockAdapter()
    throttle.push({ key: 'b', query: 'b', options: {} })
    throttle.push({ key: 'a', query: 'a', options: {} })
    const promise = throttle.flush(mockAdapter)
    vi.runAllTimers()
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
    const throttle = new ThrottledQueue()
    const mockAdapter = createMockAdapter()
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
    const throttle = new ThrottledQueue()
    const mockAdapter = createMockAdapter()
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
    const throttle = new ThrottledQueue()
    const mockAdapter = createMockAdapter()
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
  it('does not call the adapter when passing Infinity to timeMs', async () => {
    const throttle = new ThrottledQueue()
    const mockAdapter = createMockAdapter()
    throttle.push({ key: 'a', query: 'a', options: {} }, Infinity)
    const p = throttle.flush(mockAdapter)
    vi.runAllTimers()
    await expect(p).resolves.toEqual(new URLSearchParams(''))
    expect(mockAdapter.updateUrl).not.toHaveBeenCalled()
  })
  it('rejects the Promise with what should have been applied if the updateUrl function throws', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})
    const throttle = new ThrottledQueue()
    throttle.push({ key: 'a', query: 'a', options: {} })
    const p = throttle.flush({
      getSearchParamsSnapshot() {
        return new URLSearchParams('?initial=search')
      },
      updateUrl: vi.fn().mockImplementation(() => {
        throw new Error('updateUrl error')
      })
    })
    vi.runAllTimers()
    await expect(p).rejects.toEqual(new URLSearchParams('?initial=search&a=a'))
    expect(consoleErrorSpy).toHaveBeenCalledExactlyOnceWith(
      '[nuqs] URL update rate-limited by the browser. Consider increasing `throttleMs` for key(s) `%s`. %O\n  See https://err.47ng.com/NUQS-429',
      'a',
      new Error('updateUrl error')
    )
  })
  it('should process url search params', async () => {
    const mockAdapter = createMockAdapter()
    const queue = new ThrottledQueue()
    queue.push({
      key: 'a',
      query: 'a',
      options: {}
    })
    const promise = queue.flush(mockAdapter, function (search) {
      const params = new URLSearchParams(search)
      params.set('b', 'b')
      return params
    })
    expect(queue.controller).not.toBeNull()
    vi.runAllTimers()
    await expect(promise).resolves.toEqual(new URLSearchParams('?a=a&b=b'))
  })
  describe('should process url search params', () => {
    it('should add new params', async () => {
      const mockAdapter = createMockAdapter()
      const queue = new ThrottledQueue()
      queue.push({
        key: 'a',
        query: 'a',
        options: {}
      })
      const promise = queue.flush(mockAdapter, search => {
        const params = new URLSearchParams(search)
        params.set('b', 'b')
        return params
      })
      expect(queue.controller).not.toBeNull()
      vi.runAllTimers()
      await expect(promise).resolves.toEqual(new URLSearchParams('?a=a&b=b'))
    })
    it('should sort params', async () => {
      const mockAdapter = createMockAdapter()
      const queue = new ThrottledQueue()
      queue.push({
        key: 'b',
        query: 'b',
        options: {}
      })
      queue.push({
        key: 'a',
        query: 'a',
        options: {}
      })
      const promise = queue.flush(mockAdapter, search => {
        const entries = Array.from(search.entries())
        entries.sort(([a], [b]) => a.localeCompare(b))
        return new URLSearchParams(entries)
      })
      expect(queue.controller).not.toBeNull()
      vi.runAllTimers()
      await expect(promise).resolves.toEqual(new URLSearchParams('?a=a&b=b'))
    })
  })
})
