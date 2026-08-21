import React, { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { page, userEvent } from 'vitest/browser'
import { debounce } from '../lib/queues/rate-limiting'
import { resetQueues } from '../lib/queues/reset'
import { parseAsString } from '../parsers'
import { useQueryState } from '../useQueryState'
import {
  NuqsTestingAdapter,
  withNuqsTestingAdapter,
  type OnUrlUpdateFunction
} from './testing'

describe('adapters/testing: update queue lifecycle', () => {
  it('keeps an update enqueued while a flush triggers a re-render (#1517)', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()

    function TestComponent() {
      const [state, setState] = useQueryState('test', parseAsString)
      return (
        <button
          onClick={() => {
            setState('pass').then(() => setState(null))
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
    const updateButton = page.getByRole('button')

    // The first write flushes on a 0ms timer, which calls the adapter's
    // setSearchParams (hasMemory) and schedules an adapter re-render.
    // The write's promise resolves at the end of that flush, so the chained
    // second write is enqueued in a microtask before the re-render.
    // The update queue must survive that re-render.
    await user.click(updateButton)
    await vi.waitFor(() => expect(onUrlUpdate).toHaveBeenCalledTimes(2))

    expect(onUrlUpdate.mock.calls[0]![0].queryString).toBe('?test=pass')
    expect(onUrlUpdate.mock.calls[1]![0].queryString).toBe('')
    await expect.element(updateButton).toHaveTextContent('null')
  })

  it('resets the update queue for each new adapter instance', async () => {
    function TestComponent({ queryKey }: { queryKey: string }) {
      const [, setState] = useQueryState(queryKey)
      return (
        <button
          data-testid={queryKey}
          onClick={() => {
            void setState('pass', { limitUrlUpdates: debounce(100) })
          }}
        >
          update
        </button>
      )
    }

    const firstUpdate = vi.fn<OnUrlUpdateFunction>()
    const first = await render(<TestComponent queryKey="first" />, {
      wrapper: withNuqsTestingAdapter({
        onUrlUpdate: firstUpdate,
        rateLimitFactor: 1
      })
    })
    const user = userEvent.setup()
    await user.click(page.getByTestId('first'))
    await first.unmount()

    const secondUpdate = vi.fn<OnUrlUpdateFunction>()
    await render(<TestComponent queryKey="second" />, {
      wrapper: withNuqsTestingAdapter({
        onUrlUpdate: secondUpdate,
        rateLimitFactor: 1
      })
    })
    await user.click(page.getByTestId('second'))
    await vi.waitFor(() => expect(secondUpdate).toHaveBeenCalledOnce())

    expect(firstUpdate).not.toHaveBeenCalled()
    expect(secondUpdate.mock.calls[0]![0].queryString).toBe('?second=pass')
  })

  it('does not reset when the reset option becomes true after mount', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()

    function TestComponent() {
      const [state, setState] = useQueryState('test')
      return (
        <button
          data-testid="update"
          onClick={() => {
            void setState('pass', { limitUrlUpdates: debounce(10_000) })
          }}
        >
          {state ?? 'null'}
        </button>
      )
    }

    function DynamicAdapter() {
      const [resetOnMount, setResetOnMount] = useState(false)
      return (
        <>
          <button
            data-testid="enable-reset"
            onClick={() => setResetOnMount(true)}
          >
            enable reset
          </button>
          <NuqsTestingAdapter
            onUrlUpdate={onUrlUpdate}
            rateLimitFactor={1}
            resetUrlUpdateQueueOnMount={resetOnMount}
          >
            <TestComponent />
          </NuqsTestingAdapter>
        </>
      )
    }

    try {
      await render(<DynamicAdapter />)
      const user = userEvent.setup()
      await user.click(page.getByTestId('update'))
      await expect.element(page.getByTestId('update')).toHaveTextContent('pass')
      await user.click(page.getByTestId('enable-reset'))

      await expect.element(page.getByTestId('update')).toHaveTextContent('pass')
      expect(onUrlUpdate).not.toHaveBeenCalled()
    } finally {
      resetQueues()
    }
  })
})
