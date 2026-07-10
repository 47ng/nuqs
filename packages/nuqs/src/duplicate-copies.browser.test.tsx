import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import * as nextPagesAdapterA from './adapters/next/pages'
import * as reactAdapterA from './adapters/react'
import * as adapterA from './adapters/testing'
import * as nuqsA from './index'
import * as nuqsB from 'nuqs-copy-b'
import * as nextPagesAdapterB from 'nuqs-copy-b/adapters/next/pages'
import * as reactAdapterB from 'nuqs-copy-b/adapters/react'

const pagesRouterHarness = vi.hoisted(() => {
  type Listener = () => void
  const listeners = new Map<string, Set<Listener>>()
  function emit(event: string) {
    for (const listener of listeners.get(event) ?? []) {
      listener()
    }
  }
  const router = {
    asPath: '/',
    pathname: '/',
    query: {},
    state: { asPath: '/' },
    events: {
      on(event: string, listener: Listener) {
        const eventListeners = listeners.get(event) ?? new Set()
        eventListeners.add(listener)
        listeners.set(event, eventListeners)
      },
      off(event: string, listener: Listener) {
        listeners.get(event)?.delete(listener)
      }
    },
    push() {
      emit('routeChangeStart')
      emit('beforeHistoryChange')
      return Promise.resolve(true)
    },
    replace() {
      emit('routeChangeStart')
      emit('beforeHistoryChange')
      return Promise.resolve(true)
    }
  }
  return {
    router,
    reset() {
      listeners.clear()
    }
  }
})

vi.mock('next/compat/router.js', () => {
  const useRouter = () => pagesRouterHarness.router
  return { default: { useRouter }, useRouter }
})

// nuqsB is a second, independent instance of the library source graph
// (see the duplicateLibraryCopy plugin in vitest.config.ts), simulating
// a monorepo loading two physical copies of nuqs (issue #798):
// copy A provides the adapter, copy B consumes the hooks.

describe('duplicate library copies', () => {
  it('loads distinct module instances (harness self-check)', () => {
    expect(nuqsB.useQueryState).not.toBe(nuqsA.useQueryState)
  })

  it('shares the adapter context across copies', async () => {
    function Demo() {
      const [q] = nuqsB.useQueryState('q')
      return <span data-testid="q">{q}</span>
    }
    render(<Demo />, {
      wrapper: adapterA.withNuqsTestingAdapter({ searchParams: '?q=hello' })
    })
    await expect.element(page.getByTestId('q')).toHaveTextContent('hello')
  })

  it('syncs external history updates with adapters from both copies', async () => {
    const originalUrl = location.href
    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState
    originalReplaceState.call(history, null, '', '?q=hello')
    reactAdapterA.enableHistorySync()
    reactAdapterB.enableHistorySync()
    function DemoA() {
      const [q] = nuqsA.useQueryState('q')
      return <span data-testid="history-a">{q}</span>
    }
    function DemoB() {
      const [q] = nuqsB.useQueryState('q')
      return <span data-testid="history-b">{q}</span>
    }
    try {
      render(
        <>
          <reactAdapterA.NuqsAdapter>
            <DemoA />
          </reactAdapterA.NuqsAdapter>
          <reactAdapterB.NuqsAdapter>
            <DemoB />
          </reactAdapterB.NuqsAdapter>
        </>
      )
      await expect
        .element(page.getByTestId('history-a'))
        .toHaveTextContent('hello')
      await expect
        .element(page.getByTestId('history-b'))
        .toHaveTextContent('hello')

      history.pushState(null, '', '?q=external')

      await expect
        .element(page.getByTestId('history-a'))
        .toHaveTextContent('external')
      await expect
        .element(page.getByTestId('history-b'))
        .toHaveTextContent('external')
    } finally {
      history.pushState = originalPushState
      history.replaceState = originalReplaceState
      delete history.nuqs
      originalReplaceState.call(history, null, '', originalUrl)
    }
  })

  it('syncs state updates across copies', async () => {
    function DemoA() {
      const [q] = nuqsA.useQueryState('q')
      return <span data-testid="a">{q}</span>
    }
    function DemoB() {
      const [q, setQ] = nuqsB.useQueryState('q')
      return (
        <button data-testid="b" onClick={() => setQ('world')}>
          {q}
        </button>
      )
    }
    render(
      <>
        <DemoA />
        <DemoB />
      </>,
      {
        wrapper: adapterA.withNuqsTestingAdapter({ searchParams: '?q=hello' })
      }
    )
    await page.getByTestId('b').click()
    await expect.element(page.getByTestId('b')).toHaveTextContent('world')
    await expect.element(page.getByTestId('a')).toHaveTextContent('world')
  })

  it("does not abort another copy's Pages Router update", async () => {
    const originalNext = window.next
    window.next = { router: pagesRouterHarness.router as never }
    let updatePromise: Promise<URLSearchParams> | undefined
    function DemoA() {
      const [, setQ] = nuqsA.useQueryState('q')
      return (
        <button
          data-testid="pages-a"
          onClick={() => {
            updatePromise = setQ('from-a')
          }}
        />
      )
    }
    function DemoB() {
      nuqsB.useQueryState('other')
      return null
    }
    try {
      render(
        <>
          <nextPagesAdapterA.NuqsAdapter>
            <DemoA />
          </nextPagesAdapterA.NuqsAdapter>
          <nextPagesAdapterB.NuqsAdapter>
            <DemoB />
          </nextPagesAdapterB.NuqsAdapter>
        </>
      )
      await page.getByTestId('pages-a').click()
      await vi.waitFor(() => expect(updatePromise).toBeDefined())
      const search = await updatePromise!
      expect(search.get('q')).toBe('from-a')
    } finally {
      window.next = originalNext
      pagesRouterHarness.reset()
    }
  })

  it('batches updates from both copies into a single URL update', async () => {
    const onUrlUpdate = vi.fn<adapterA.OnUrlUpdateFunction>()
    function Demo() {
      const [, setA] = nuqsA.useQueryState('a')
      const [, setB] = nuqsB.useQueryState('b')
      return (
        <button
          data-testid="both"
          onClick={() => {
            setA('1')
            setB('2')
          }}
        />
      )
    }
    render(<Demo />, {
      wrapper: adapterA.withNuqsTestingAdapter({ onUrlUpdate })
    })
    await page.getByTestId('both').click()
    await vi.waitFor(() => expect(onUrlUpdate).toHaveBeenCalled())
    await new Promise(resolve => setTimeout(resolve, 25))
    expect(onUrlUpdate).toHaveBeenCalledTimes(1)
    const [event] = onUrlUpdate.mock.calls[0]!
    expect(event.searchParams.get('a')).toBe('1')
    expect(event.searchParams.get('b')).toBe('2')
  })

  it('cancels a pending debounced update from the other copy', async () => {
    const onUrlUpdate = vi.fn<adapterA.OnUrlUpdateFunction>()
    function Demo() {
      const [, setA] = nuqsA.useQueryState('q')
      const [, setB] = nuqsB.useQueryState('q')
      return (
        <button
          data-testid="race"
          onClick={() => {
            setA('slow', { limitUrlUpdates: nuqsA.debounce(100) })
            setB('fast')
          }}
        />
      )
    }
    render(<Demo />, {
      wrapper: adapterA.withNuqsTestingAdapter({ onUrlUpdate })
    })
    await page.getByTestId('race').click()
    await new Promise(resolve => setTimeout(resolve, 200))
    expect(onUrlUpdate).toHaveBeenCalledTimes(1)
    const [event] = onUrlUpdate.mock.calls.at(-1)!
    expect(event.searchParams.get('q')).toBe('fast')
  })

  it('shows optimistic state from the other copy before the URL commits', async () => {
    const onUrlUpdate = vi.fn<adapterA.OnUrlUpdateFunction>()
    function DemoA() {
      const [q] = nuqsA.useQueryState('q')
      return <span data-testid="a">{q}</span>
    }
    function DemoB() {
      const [, setQ] = nuqsB.useQueryState('q')
      return (
        <button
          data-testid="b"
          onClick={() =>
            setQ('optimistic', { limitUrlUpdates: nuqsB.throttle(500) })
          }
        />
      )
    }
    render(
      <>
        <DemoA />
        <DemoB />
      </>,
      {
        wrapper: adapterA.withNuqsTestingAdapter({
          onUrlUpdate,
          rateLimitFactor: 1
        })
      }
    )
    await page.getByTestId('b').click()
    await expect.element(page.getByTestId('a')).toHaveTextContent('optimistic')
    expect(onUrlUpdate).not.toHaveBeenCalled()
  })

  it('shows pending debounced state from the other copy', async () => {
    const onUrlUpdate = vi.fn<adapterA.OnUrlUpdateFunction>()
    function DemoA() {
      const [q] = nuqsA.useQueryState('q')
      return <span data-testid="a">{q}</span>
    }
    function DemoB() {
      const [, setQ] = nuqsB.useQueryState('q')
      return (
        <button
          data-testid="b"
          onClick={() =>
            setQ('typed', { limitUrlUpdates: nuqsB.debounce(100) })
          }
        />
      )
    }
    render(
      <>
        <DemoA />
        <DemoB />
      </>,
      {
        wrapper: adapterA.withNuqsTestingAdapter({ onUrlUpdate })
      }
    )
    await page.getByTestId('b').click()
    await expect.element(page.getByTestId('a')).toHaveTextContent('typed')
    expect(onUrlUpdate).not.toHaveBeenCalled()
    await new Promise(resolve => setTimeout(resolve, 200))
    expect(onUrlUpdate).toHaveBeenCalledTimes(1)
    const [event] = onUrlUpdate.mock.calls.at(-1)!
    expect(event.searchParams.get('q')).toBe('typed')
  })
})
