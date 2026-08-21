import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { page, userEvent } from 'vitest/browser'
import { parseAsString } from '../parsers'
import { useQueryState } from '../useQueryState'
import { withNuqsTestingAdapter, type OnUrlUpdateFunction } from './testing'

describe('adapters/testing: update queue survival (#1517)', () => {
  it('keeps an update enqueued while a flush lands (hasMemory)', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()

    function TestComponent() {
      const [state, setState] = useQueryState('test', parseAsString)
      return (
        <button
          onClick={() => {
            setState('pass').then(() => setState(null).catch(() => {}))
          }}
        >
          {state ?? 'null'}
        </button>
      )
    }

    render(<TestComponent />, {
      wrapper: withNuqsTestingAdapter({
        hasMemory: true,
        onUrlUpdate
      })
    })

    const user = userEvent.setup()
    const updateButton = page.getByRole('button', { name: 'null' })

    // The first write flushes on a 0ms timer, which calls the adapter's
    // setSearchParams (hasMemory) and schedules an adapter re-render. The
    // write's promise resolves at the end of that flush, so the chained
    // second write is enqueued in a microtask BEFORE the re-render commits.
    // The update queue must survive that commit.
    await user.click(updateButton)
    await vi.waitFor(() => expect(onUrlUpdate).toHaveBeenCalledTimes(2))

    expect(onUrlUpdate.mock.calls[1]![0].searchParams.get('test')).toBeNull()
    await expect.element(updateButton).toHaveTextContent('null')
  })
})
