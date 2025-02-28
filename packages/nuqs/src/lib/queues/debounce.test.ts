import { setTimeout } from 'node:timers/promises'
import { describe, expect, it, vi } from 'vitest'
import type { UpdateUrlFunction } from '../../adapters/lib/defs'
import { DebounceController, DebouncedPromiseQueue } from './debounce'
import { ThrottledQueue, type UpdateQueueAdapterContext } from './throttle'

async function passThrough<T>(value: T): Promise<T> {
  return value
}

describe('debounce: DebouncedPromiseQueue', () => {
  it('calls the callback after the timer expired', () => {
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
    const queue = new DebouncedPromiseQueue(passThrough)
    const p1 = queue.push('a', 100)
    const p2 = queue.push('b', 100)
    expect(p1).toBe(p2)
    vi.advanceTimersToNextTimer()
    await expect(p1).resolves.toBe('b')
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
  it('keeps a record of the last queued value', async () => {
    vi.useFakeTimers()
    const queue = new DebouncedPromiseQueue(passThrough)
    const p = queue.push('a', 100)
    expect(queue.queuedValue).toBe('a')
    vi.advanceTimersToNextTimer()
    await expect(p).resolves.toBe('a')
    expect(queue.queuedValue).toBeUndefined()
  })
  it('clears the queued value when the callback returns its promise (not when it resolves)', () => {
    vi.useFakeTimers()
    const queue = new DebouncedPromiseQueue(async input => {
      await setTimeout(100)
      return input
    })
    queue.push('a', 100)
    vi.advanceTimersByTime(100)
    expect(queue.queuedValue).toBeUndefined()
  })
  it('clears the queued value when the callback throws an error synchronously', async () => {
    vi.useFakeTimers()
    const queue = new DebouncedPromiseQueue(() => {
      throw new Error('error')
    })
    const p = queue.push('a', 100)
    vi.advanceTimersToNextTimer()
    expect(queue.queuedValue).toBeUndefined()
    await expect(p).rejects.toThrowError('error')
  })
  it('clears the queued value when the callback rejects', async () => {
    vi.useFakeTimers()
    const queue = new DebouncedPromiseQueue(() =>
      Promise.reject(new Error('error'))
    )
    const p = queue.push('a', 100)
    vi.advanceTimersToNextTimer()
    expect(queue.queuedValue).toBeUndefined()
    await expect(p).rejects.toThrowError('error')
  })
  it('returns a new Promise when an update is pushed while the callback is pending', async () => {
    vi.useFakeTimers()
    const queue = new DebouncedPromiseQueue(async input => {
      await setTimeout(100)
      return input
    })
    const p1 = queue.push('a', 100)
    vi.advanceTimersByTime(150) // 100ms debounce + half the callback settle time
    const p2 = queue.push('b', 100)
    expect(p1).not.toBe(p2)
    vi.advanceTimersToNextTimer()
    await expect(p1).resolves.toBe('a')
    await expect(p2).resolves.toBe('b')
  })
})

describe('debounce: DebounceController', () => {
  it('schedules an update and calls the adapter with it', async () => {
    vi.useFakeTimers()
    const fakeAdapter: UpdateQueueAdapterContext = {
      updateUrl: vi.fn<UpdateUrlFunction>(),
      getSearchParamsSnapshot() {
        return new URLSearchParams()
      }
    }
    const controller = new DebounceController()
    const promise = controller.push(
      {
        key: 'key',
        query: 'value',
        options: {}
      },
      100,
      fakeAdapter
    )
    const queue = controller.queues.get('key')
    expect(queue).toBeInstanceOf(DebouncedPromiseQueue)
    vi.runAllTimers()
    await expect(promise).resolves.toEqual(new URLSearchParams('?key=value'))
    expect(fakeAdapter.updateUrl).toHaveBeenCalledExactlyOnceWith(
      new URLSearchParams('?key=value'),
      {
        history: 'replace',
        scroll: false,
        shallow: true
      }
    )
  })
  it('isolates debounce queues per key', async () => {
    vi.useFakeTimers()
    const fakeAdapter: UpdateQueueAdapterContext = {
      updateUrl: vi.fn<UpdateUrlFunction>(),
      getSearchParamsSnapshot() {
        return new URLSearchParams()
      }
    }
    const controller = new DebounceController()
    const promise1 = controller.push(
      {
        key: 'a',
        query: 'a',
        options: {}
      },
      100,
      fakeAdapter
    )
    const promise2 = controller.push(
      {
        key: 'b',
        query: 'b',
        options: {}
      },
      200,
      fakeAdapter
    )
    expect(promise1).not.toBe(promise2)
    vi.runAllTimers()
    await expect(promise1).resolves.toEqual(new URLSearchParams('?a=a'))
    // Our snapshot always returns an empty search params object, so there is no
    // merging of keys here.
    await expect(promise2).resolves.toEqual(new URLSearchParams('?b=b'))
    expect(fakeAdapter.updateUrl).toHaveBeenCalledTimes(2)
  })
  it('keeps a record of pending updates', async () => {
    vi.useFakeTimers()
    const fakeAdapter: UpdateQueueAdapterContext = {
      updateUrl: vi.fn<UpdateUrlFunction>(),
      getSearchParamsSnapshot() {
        return new URLSearchParams()
      }
    }
    const controller = new DebounceController()
    controller.push(
      {
        key: 'key',
        query: 'value',
        options: {}
      },
      100,
      fakeAdapter
    )
    expect(controller.getQueuedQuery('key')).toEqual('value')
    vi.runAllTimers()
    expect(controller.getQueuedQuery('key')).toBeUndefined()
  })
  it('falls back to the throttle queue pending values if nothing is debounced', () => {
    const throttleQueue = new ThrottledQueue()
    throttleQueue.push({
      key: 'key',
      query: 'value',
      options: {}
    })
    const controller = new DebounceController(throttleQueue)
    expect(controller.getQueuedQuery('key')).toEqual('value')
  })
  it('aborts an update and chains the Promise onto another one that overrides it', async () => {
    vi.useFakeTimers()
    const fakeAdapter: UpdateQueueAdapterContext = {
      updateUrl: vi.fn<UpdateUrlFunction>(),
      getSearchParamsSnapshot() {
        return new URLSearchParams()
      }
    }
    const controller = new DebounceController()
    const debouncedPromise = controller.push(
      {
        key: 'key',
        query: 'value',
        options: {}
      },
      100,
      fakeAdapter
    )
    const attach = controller.abort('key')
    expect(attach).toBeInstanceOf(Function)
    vi.runAllTimers()
    const resolvedPromise = Promise.resolve(
      new URLSearchParams('?key=override')
    )
    const attachedPromise = attach(resolvedPromise)
    expect(attachedPromise).toBe(resolvedPromise) // Referential equality
    await expect(debouncedPromise).resolves.toEqual(
      new URLSearchParams('?key=override')
    )
  })
})
