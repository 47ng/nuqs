import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { markHistoryAsPatched } from '../../adapters/lib/patch-history'
import { version } from '../version'
import { ThrottledQueue, type UpdateQueueAdapterContext } from './throttle'

function createMockAdapter(): UpdateQueueAdapterContext {
  return {
    updateUrl: vi.fn(),
    getSearchParamsSnapshot: () => new URLSearchParams()
  }
}

describe('throttle: shared rate-limit budget', () => {
  beforeEach(() => {
    delete history.nuqs
  })
  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('shares lastFlushedAt across queue instances via history.nuqs', () => {
    const a = new ThrottledQueue()
    const b = new ThrottledQueue()
    a.lastFlushedAt = 12_345
    expect(b.lastFlushedAt).toBe(12_345)
    expect(history.nuqs?.lastFlushedAt).toBe(12_345)
  })

  it('seeds the adapters list when the queue creates the history slot', () => {
    const queue = new ThrottledQueue()
    queue.lastFlushedAt = 12_345
    expect(history.nuqs).toStrictEqual({ adapters: [], lastFlushedAt: 12_345 })
  })

  it('keeps the shared flush time when an adapter claims the slot', () => {
    const queue = new ThrottledQueue()
    queue.lastFlushedAt = 12_345
    markHistoryAsPatched('test-budget-adapter')
    expect(history.nuqs).toStrictEqual({
      version,
      adapters: ['test-budget-adapter'],
      lastFlushedAt: 12_345
    })
    expect(queue.lastFlushedAt).toBe(12_345)
  })

  it('makes a second queue wait out the window opened by the first', async () => {
    vi.useFakeTimers()
    const now = vi.spyOn(performance, 'now').mockReturnValue(1_000)
    const adapter = createMockAdapter()

    const first = new ThrottledQueue()
    first.push({ key: 'a', query: 'a', options: {} }, 100)
    const firstFlush = first.flush(adapter)
    await vi.runAllTimersAsync()
    await firstFlush
    expect(adapter.updateUrl).toHaveBeenCalledOnce()
    expect(history.nuqs?.lastFlushedAt).toBe(1_000)

    now.mockReturnValue(1_050)
    const second = new ThrottledQueue()
    second.push({ key: 'b', query: 'b', options: {} }, 100)
    const secondFlush = second.flush(adapter)
    await vi.advanceTimersByTimeAsync(49)
    expect(adapter.updateUrl).toHaveBeenCalledOnce()
    await vi.advanceTimersByTimeAsync(1)
    await secondFlush
    expect(adapter.updateUrl).toHaveBeenCalledTimes(2)
  })
})
