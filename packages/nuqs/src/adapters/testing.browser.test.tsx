import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { parseAsString } from '../parsers'
import { useQueryState } from '../useQueryState'
import { withNuqsTestingAdapter, type OnUrlUpdateFunction } from './testing'

const waitForSettle = () =>
  new Promise<void>(resolve => {
    setTimeout(resolve, 100)
  })

describe('adapters/testing: update queue survival (#1517)', () => {
  it('keeps an update enqueued while a flush lands (hasMemory)', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    let value: string | null = null
    let setValue: (update: string | null) => Promise<unknown> = () =>
      Promise.resolve()

    function TestComponent() {
      const [state, setState] = useQueryState('test', parseAsString)
      value = state
      setValue = setState
      return <span>{state ?? 'null'}</span>
    }

    render(<TestComponent />, {
      wrapper: withNuqsTestingAdapter({
        hasMemory: true,
        onUrlUpdate
      })
    })

    // Wait for the first commit so the captured setter is the real one.
    await waitForSettle()

    // The first write flushes on a 0ms timer, which calls the adapter's
    // setSearchParams (hasMemory) and schedules an adapter re-render. The
    // write's promise resolves at the end of that flush, so the chained
    // second write is enqueued in a microtask BEFORE the re-render commits.
    // The update queue must survive that commit.
    await setValue('pass').then(() => setValue(null).catch(() => {}))
    await waitForSettle()

    expect(onUrlUpdate).toHaveBeenCalledTimes(2)
    expect(onUrlUpdate.mock.calls[1]![0].searchParams.get('test')).toBeNull()
    expect(value).toBe(null)
  })
})
