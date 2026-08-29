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

describe('throttle: shared rate-limit budget', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shares the last flush time through the history slot', () => {
    vi.stubGlobal('history', {})
    const first = new ThrottledQueue()
    const second = new ThrottledQueue()

    first.lastFlushedAt = 12_345

    expect(history.nuqs).toEqual({ adapters: [], lastFlushedAt: 12_345 })
    expect(second.lastFlushedAt).toBe(12_345)
  })
})

describe('throttle: ThrottleQueue value queueing', () => {
  it('returns the current snapshot when no flush is pending', async () => {
    const queue = new ThrottledQueue()
    const adapter = createMockAdapter()
    const snapshot = new URLSearchParams('?committed=value')
    adapter.getSearchParamsSnapshot = vi.fn(() => snapshot)

    const pending = queue.getPendingPromise(adapter)

    expect(pending).toBeInstanceOf(Promise)
    await expect(pending).resolves.toBe(snapshot)
  })

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
  it('should preserve explicit options that do not override the defaults', () => {
    const queue = new ThrottledQueue()
    queue.push({
      key: 'a',
      query: null,
      options: { history: 'replace', scroll: false, shallow: true }
    })
    expect(queue.options).toEqual({
      history: 'replace',
      scroll: false,
      shallow: true
    })
  })
  it('should restore default options when reset', () => {
    const queue = new ThrottledQueue()
    queue.push({
      key: 'a',
      query: null,
      options: { history: 'push', scroll: true, shallow: false }
    })
    queue.reset()
    expect(queue.options).toEqual({
      history: 'replace',
      scroll: false,
      shallow: true
    })
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
  it('passes the updateUrl result to the transition, so a Promise makes it an async action', async () => {
    const navigationSettled = Promise.resolve()
    const mockAdapter = createMockAdapter()
    vi.mocked(mockAdapter.updateUrl).mockReturnValue(navigationSettled)
    const onTransitionReturn = vi.fn()
    const startTransition = vi
      .fn()
      .mockImplementation((callback: () => void | Promise<void>) =>
        onTransitionReturn(callback())
      )
    const queue = new ThrottledQueue()
    queue.push({ key: 'a', query: null, options: { startTransition } })
    await queue.flush(mockAdapter)
    expect(onTransitionReturn).toHaveBeenCalledExactlyOnceWith(
      navigationSettled
    )
  })
  it('keeps the maximum value for timeMs', () => {
    const queue = new ThrottledQueue()
    queue.push({ key: 'a', query: null, options: {} }, 100)
    queue.push({ key: 'b', query: null, options: {} }, 200)
    queue.push({ key: 'c', query: null, options: {} }, 300)
    expect(queue.timeMs).toEqual(300)
  })
  it('reads the default timeMs lazily', () => {
    const originalTimeMs = defaultRateLimit.timeMs
    try {
      defaultRateLimit.timeMs = 100
      const queue = new ThrottledQueue()
      queue.push({ key: 'a', query: null, options: {} })
      expect(queue.timeMs).toEqual(100)
    } finally {
      defaultRateLimit.timeMs = originalTimeMs
    }
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
  it('allows aborting an unused queue', async () => {
    const queue = new ThrottledQueue()
    expect(queue.abort()).toEqual([])
    const adapter = createMockAdapter()
    queue.push({ key: 'a', query: 'a', options: {} })
    const promise = queue.flush(adapter)
    vi.runAllTimers()
    await expect(promise).resolves.toEqual(new URLSearchParams('?a=a'))
  })
  it('allows aborting a previously flushed queue', async () => {
    const queue = new ThrottledQueue()
    const adapter = createMockAdapter()
    queue.push({ key: 'a', query: 'a', options: {} })
    const promise = queue.flush(adapter)
    vi.runAllTimers()
    await promise
    expect(queue.abort()).toEqual([])
  })
})

describe('throttle: overlay sync notifications', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })
  it('notifies subscribers when pushing an update', () => {
    const queue = new ThrottledQueue()
    const spy = vi.fn()
    queue.sync.on('key', spy)
    queue.push({ key: 'key', query: 'value', options: {} })
    expect(spy).toHaveBeenCalledOnce()
  })
  it('notifies subscribers of each cleared key when resetting', () => {
    const queue = new ThrottledQueue()
    const spyA = vi.fn()
    const spyB = vi.fn()
    queue.push({ key: 'a', query: 'a', options: {} })
    queue.push({ key: 'b', query: 'b', options: {} })
    queue.sync.on('a', spyA)
    queue.sync.on('b', spyB)
    queue.reset()
    expect(spyA).toHaveBeenCalledOnce()
    expect(spyB).toHaveBeenCalledOnce()
  })
  it('does not notify when resetting with notify: false', () => {
    const queue = new ThrottledQueue()
    const spy = vi.fn()
    queue.push({ key: 'a', query: 'a', options: {} })
    queue.sync.on('a', spy)
    queue.reset({ notify: false })
    expect(spy).not.toHaveBeenCalled()
  })
  it('notifies subscribers of cleared keys when aborting', () => {
    const queue = new ThrottledQueue()
    const spy = vi.fn()
    queue.push({ key: 'a', query: 'a', options: {} })
    queue.sync.on('a', spy)
    queue.abort()
    expect(spy).toHaveBeenCalledOnce()
  })
  it('does not notify when clearing the queue after a flush', async () => {
    const queue = new ThrottledQueue()
    const mockAdapter = createMockAdapter()
    queue.push({ key: 'a', query: 'a', options: {} })
    const spy = vi.fn()
    queue.sync.on('a', spy)
    const promise = queue.flush(mockAdapter)
    vi.runAllTimers()
    await promise
    expect(queue.updateMap.size).toBe(0)
    expect(spy).not.toHaveBeenCalled()
  })
  it('notifies the failed keys when the URL update throws', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})
    const queue = new ThrottledQueue()
    queue.push({ key: 'a', query: 'a', options: {} })
    const spy = vi.fn()
    queue.sync.on('a', spy)
    const promise = queue.flush({
      getSearchParamsSnapshot() {
        return new URLSearchParams()
      },
      updateUrl: vi.fn().mockImplementation(() => {
        throw new Error('rate limited')
      })
    })
    vi.runAllTimers()
    await expect(promise).rejects.toEqual(new URLSearchParams('?a=a'))
    // The overlay was cleared but the URL never changed: subscribers must
    // be notified to converge back to the committed search params.
    expect(spy).toHaveBeenCalledOnce()
    expect(consoleErrorSpy).toHaveBeenCalledOnce()
  })
  it('clears failed overlay values when the adapter defers normal reset', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})
    const queue = new ThrottledQueue()
    queue.push({ key: 'a', query: 'a', options: {} })
    const spy = vi.fn()
    queue.sync.on('a', spy)
    const promise = queue.flush({
      autoResetQueueOnUpdate: false,
      getSearchParamsSnapshot() {
        return new URLSearchParams()
      },
      updateUrl: vi.fn().mockImplementation(() => {
        throw new Error('rate limited')
      })
    })
    vi.runAllTimers()
    await expect(promise).rejects.toEqual(new URLSearchParams('?a=a'))
    expect(queue.getQueuedQuery('a')).toBeUndefined()
    expect(spy).toHaveBeenCalledOnce()
    expect(consoleErrorSpy).toHaveBeenCalledOnce()
  })
  it('does not notify previously-flushed keys when resetting on the next push', async () => {
    const queue = new ThrottledQueue()
    const mockAdapter: UpdateQueueAdapterContext = {
      ...createMockAdapter(),
      autoResetQueueOnUpdate: false
    }
    queue.push({ key: 'a', query: 'a', options: {} })
    const promise = queue.flush(mockAdapter)
    vi.runAllTimers()
    await promise
    // 'a' survived the flush (committed view may lag behind)
    expect(queue.updateMap.size).toBe(1)
    const spyA = vi.fn()
    const spyB = vi.fn()
    queue.sync.on('a', spyA)
    queue.sync.on('b', spyB)
    queue.push({ key: 'b', query: 'b', options: {} })
    expect(spyA).not.toHaveBeenCalled()
    expect(spyB).toHaveBeenCalledOnce()
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
  it('deletes a queued null value from the current URL', async () => {
    const queue = new ThrottledQueue()
    const adapter = {
      ...createMockAdapter(),
      getSearchParamsSnapshot: () => new URLSearchParams('?a=old&keep=value')
    }
    queue.push({ key: 'a', query: null, options: {} })
    const promise = queue.flush(adapter)
    vi.runAllTimers()
    await expect(promise).resolves.toEqual(new URLSearchParams('?keep=value'))
    expect(adapter.updateUrl).toHaveBeenCalledExactlyOnceWith(
      new URLSearchParams('?keep=value'),
      { history: 'replace', scroll: false, shallow: true }
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
      '[nuqs] URL update rate-limited by the browser. Consider increasing `throttleMs` for key(s) `%s`. %O\n  See https://nuqs.dev/NUQS-429',
      'a',
      new Error('updateUrl error')
    )
  })
  it('rejects and resets when processUrlSearchParams throws', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})
    const adapter = {
      ...createMockAdapter(),
      autoResetQueueOnUpdate: false
    }
    const queue = new ThrottledQueue()
    queue.push({ key: 'a', query: 'a', options: {} })
    const promise = queue.flush(adapter, () => {
      throw new Error('middleware error')
    })

    expect(() => vi.runAllTimers()).not.toThrow()
    await expect(promise).rejects.toEqual(new URLSearchParams('?a=a'))
    expect(adapter.updateUrl).not.toHaveBeenCalled()
    expect(consoleErrorSpy).toHaveBeenCalledExactlyOnceWith(
      '[nuqs] `processUrlSearchParams` threw while processing key(s) `%s`. %O\n  See https://nuqs.dev/NUQS-502',
      'a',
      new Error('middleware error')
    )

    // The first push discards the failed batch. Later pushes join the new batch.
    queue.push({ key: 'first', query: 'one', options: {} })
    queue.push({ key: 'second', query: 'two', options: {} })
    const nextPromise = queue.flush(adapter)
    vi.runAllTimers()
    await expect(nextPromise).resolves.toEqual(
      new URLSearchParams('?first=one&second=two')
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
  it('starts each completed batch with fresh values and options', async () => {
    const adapter = createMockAdapter()
    const queue = new ThrottledQueue()
    queue.push({
      key: 'first',
      query: 'one',
      options: { history: 'push', scroll: true, shallow: false }
    })
    const first = queue.flush(adapter)
    vi.runAllTimers()
    await first
    expect(adapter.updateUrl).toHaveBeenNthCalledWith(
      1,
      new URLSearchParams('?first=one'),
      { history: 'push', scroll: true, shallow: false }
    )

    queue.push({ key: 'second', query: 'two', options: {} })
    queue.push({ key: 'third', query: 'three', options: {} })
    const second = queue.flush(adapter)
    vi.runAllTimers()
    await second

    expect(adapter.updateUrl).toHaveBeenLastCalledWith(
      new URLSearchParams('?second=two&third=three'),
      { history: 'replace', scroll: false, shallow: true }
    )
  })

  it('keeps a completed batch readable until the next push (when autoResetQueueOnUpdate: false)', async () => {
    const adapter = {
      ...createMockAdapter(),
      autoResetQueueOnUpdate: false
    }
    const queue = new ThrottledQueue()
    queue.push({ key: 'search', query: 'nuqs', options: {} })
    const first = queue.flush(adapter)
    vi.runAllTimers()
    await first
    expect(queue.getQueuedQuery('search')).toBe('nuqs')

    queue.push({ key: 'next', query: 'batch', options: {} })
    const second = queue.flush(adapter)
    vi.runAllTimers()
    await second
    expect(adapter.updateUrl).toHaveBeenCalledTimes(2)
    expect(adapter.updateUrl).toHaveBeenLastCalledWith(
      new URLSearchParams('?next=batch'),
      { history: 'replace', scroll: false, shallow: true }
    )
  })

  it('applies the adapter rate-limit factor to the initial delay', async () => {
    const adapter = {
      ...createMockAdapter(),
      rateLimitFactor: 2
    }
    const queue = new ThrottledQueue()
    queue.push({ key: 'a', query: 'a', options: {} })
    const promise = queue.flush(adapter)
    // The default 50 ms delay times rateLimitFactor 2 gives 100 ms.
    vi.advanceTimersByTime(99)
    expect(adapter.updateUrl).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    await promise
    expect(adapter.updateUrl).toHaveBeenCalledOnce()
  })

  it('waits for the remaining rate-limit window before flushing', async () => {
    let now = 100
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    const adapter = {
      ...createMockAdapter(),
      rateLimitFactor: 2
    }
    const queue = new ThrottledQueue()
    queue.push({ key: 'first', query: 'one', options: {} }, 100)
    const first = queue.flush(adapter)
    vi.advanceTimersToNextTimer()
    await first
    expect(adapter.updateUrl).toHaveBeenCalledTimes(1)

    // performance.now() timeline:
    //
    // previous flush       current time        normal window end
    // t=100                t=150               t=200
    //   |--------------------|--------------------|
    //        50 ms elapsed          50 ms left
    //
    // rateLimitFactor 2 doubles the remaining wait to 100 ms.
    now = 150
    queue.push({ key: 'second', query: 'two', options: {} }, 100)
    const second = queue.flush(adapter)
    vi.advanceTimersToNextTimer()
    vi.advanceTimersByTime(99)
    expect(adapter.updateUrl).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(1)
    await second
    expect(adapter.updateUrl).toHaveBeenCalledTimes(2)
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
        search.sort()
        return search
      })
      expect(queue.controller).not.toBeNull()
      vi.runAllTimers()
      await expect(promise).resolves.toEqual(new URLSearchParams('?a=a&b=b'))
    })
  })
})
