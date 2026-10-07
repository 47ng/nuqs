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
  it('does not register a transition when none is given', () => {
    const queue = new ThrottledQueue()
    queue.push({ key: 'a', query: 'a', options: {} })
    expect(queue.transitions.size).toBe(0)
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

describe('throttle: acknowledgement of flushed values', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  const adapter = {
    ...createMockAdapter(),
    autoResetQueueOnUpdate: false
  }

  async function flush(queue: ThrottledQueue) {
    const flushed = queue.flush(adapter)
    vi.runAllTimers()
    await flushed
  }

  async function createQueueAwaitingAcknowledgement() {
    const queue = new ThrottledQueue()
    queue.push({ key: 'selected', query: 'item-1', options: {} })
    await flush(queue)
    queue.push({ key: 'filter', query: null, options: {} })
    return queue
  }

  const url = (search: string) => () => new URLSearchParams(search)

  it('keeps a flushed value while the adapter search params lag behind the URL', async () => {
    const queue = await createQueueAwaitingAcknowledgement()
    queue.acknowledge(new URLSearchParams(), url('?selected=item-1'))
    expect(queue.getQueuedQuery('selected')).toBe('item-1')
  })

  it('drops a flushed value once the adapter search params match the URL', async () => {
    const queue = await createQueueAwaitingAcknowledgement()
    const changed = queue.acknowledge(
      new URLSearchParams('?selected=item-1'),
      url('?selected=item-1')
    )
    expect(queue.getQueuedQuery('selected')).toBeUndefined()
    expect(changed).toEqual([])
  })

  it('drops a flushed value when the URL changed externally and the adapter caught up', async () => {
    const queue = await createQueueAwaitingAcknowledgement()
    const changed = queue.acknowledge(
      new URLSearchParams('?selected=other'),
      url('?selected=other')
    )
    expect(queue.getQueuedQuery('selected')).toBeUndefined()
    expect(changed).toEqual(['selected'])
  })

  it('drops a flushed value once the URL no longer holds it, even if the adapter lags', async () => {
    const queue = await createQueueAwaitingAcknowledgement()
    const changed = queue.acknowledge(
      new URLSearchParams(),
      url('?selected=other')
    )
    expect(queue.getQueuedQuery('selected')).toBeUndefined()
    expect(changed).toEqual(['selected'])
  })

  it('keeps the latest value when the same key is flushed twice', async () => {
    const queue = await createQueueAwaitingAcknowledgement()
    queue.push({ key: 'selected', query: 'item-2', options: {} })
    await flush(queue)
    queue.push({ key: 'page', query: '2', options: {} })
    queue.acknowledge(
      new URLSearchParams('?selected=item-1'),
      url('?selected=item-2')
    )
    expect(queue.getQueuedQuery('selected')).toBe('item-2')
    queue.acknowledge(
      new URLSearchParams('?selected=item-2'),
      url('?selected=item-2')
    )
    expect(queue.getQueuedQuery('selected')).toBeUndefined()
  })

  it('compares multi-value keys with all their values', async () => {
    const queue = new ThrottledQueue()
    queue.push({ key: 'tags', query: ['a', 'b'], options: {} })
    await flush(queue)
    queue.push({ key: 'page', query: '2', options: {} })
    queue.acknowledge(new URLSearchParams('?tags=a'), url('?tags=a&tags=b'))
    expect(queue.getQueuedQuery('tags')).toEqual(['a', 'b'])
    const changed = queue.acknowledge(
      new URLSearchParams('?tags=a&tags=b'),
      url('?tags=a&tags=b')
    )
    expect(queue.getQueuedQuery('tags')).toBeUndefined()
    expect(changed).toEqual([])
  })

  it('drops a flushed value that did not change the URL', async () => {
    const queue = await createQueueAwaitingAcknowledgement()
    await flush(queue)
    queue.push({ key: 'page', query: '2', options: {} })
    const changed = queue.acknowledge(
      new URLSearchParams(),
      url('?selected=item-1')
    )
    expect(queue.getQueuedQuery('filter')).toBeUndefined()
    expect(queue.getQueuedQuery('selected')).toBe('item-1')
    expect(changed).toEqual([])
  })

  it('does not drop queued values that were not flushed yet', () => {
    const queue = new ThrottledQueue()
    queue.push({ key: 'selected', query: 'item-1', options: {} })
    queue.acknowledge(new URLSearchParams(), url(''))
    expect(queue.getQueuedQuery('selected')).toBe('item-1')
  })

  it('keeps values awaiting acknowledgement across later batches', async () => {
    const queue = await createQueueAwaitingAcknowledgement()
    await flush(queue)
    queue.push({ key: 'page', query: '2', options: {} })
    expect(queue.getQueuedQuery('selected')).toBe('item-1')
    expect(queue.getQueuedQuery('filter')).toBeNull()
  })

  it('prefers a newer queued value over one awaiting acknowledgement', async () => {
    const queue = await createQueueAwaitingAcknowledgement()
    queue.push({ key: 'selected', query: 'item-2', options: {} })
    expect(queue.getQueuedQuery('selected')).toBe('item-2')
  })

  it('clears and reports values awaiting acknowledgement on reset', async () => {
    const queue = await createQueueAwaitingAcknowledgement()
    expect(queue.reset()).toContain('selected')
    expect(queue.getQueuedQuery('selected')).toBeUndefined()
  })
})

describe('throttle: flush', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns the pending flush Promise, or the current search params when idle', async () => {
    const adapter = {
      ...createMockAdapter(),
      getSearchParamsSnapshot: () => new URLSearchParams('?idle=true')
    }
    const queue = new ThrottledQueue()
    await expect(queue.getPendingPromise(adapter)).resolves.toEqual(
      new URLSearchParams('?idle=true')
    )
    queue.push({ key: 'a', query: 'a', options: {} })
    const flushed = queue.flush(adapter)
    expect(queue.getPendingPromise(adapter)).toBe(flushed)
    vi.runAllTimers()
    await flushed
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

  it('keeps a flushed batch readable after the next push, until acknowledged (when autoResetQueueOnUpdate: false)', async () => {
    const adapter = {
      ...createMockAdapter(),
      autoResetQueueOnUpdate: false
    }
    const queue = new ThrottledQueue()
    queue.push({ key: 'search', query: 'nuqs', options: {} })
    const first = queue.flush(adapter)
    vi.runAllTimers()
    await first

    queue.push({ key: 'next', query: 'batch', options: {} })
    expect(queue.getQueuedQuery('search')).toBe('nuqs')
    const second = queue.flush(adapter)
    vi.runAllTimers()
    await second
    expect(adapter.updateUrl).toHaveBeenLastCalledWith(
      new URLSearchParams('?next=batch'),
      { history: 'replace', scroll: false, shallow: true }
    )
  })

  it('does not keep a flushed batch after the next push (when autoResetQueueOnUpdate: true)', async () => {
    const adapter = createMockAdapter()
    const queue = new ThrottledQueue()
    queue.push({ key: 'search', query: 'nuqs', options: {} })
    const first = queue.flush(adapter)
    vi.runAllTimers()
    await first

    queue.push({ key: 'next', query: 'batch', options: {} })
    expect(queue.getQueuedQuery('search')).toBeUndefined()
  })

  it('does not keep a batch rejected by processUrlSearchParams after the next push', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const adapter = {
      ...createMockAdapter(),
      autoResetQueueOnUpdate: false
    }
    const queue = new ThrottledQueue()
    queue.push({ key: 'a', query: 'a', options: {} })
    const promise = queue.flush(adapter, () => {
      throw new Error('middleware error')
    })
    vi.runAllTimers()
    await expect(promise).rejects.toBeDefined()

    queue.push({ key: 'b', query: 'b', options: {} })
    expect(queue.getQueuedQuery('a')).toBeUndefined()
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
