import React, {
  createContext,
  startTransition,
  Suspense,
  useContext,
  useEffect,
  useInsertionEffect,
  useState
} from 'react'
import { describe, expect, it, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { render, renderHook } from 'vitest-browser-react'
import { globalThrottleQueue } from '../../lib/queues/throttle'
import { NavigationSpy, useNuqsNextAppRouterAdapter } from './impl.app'

const route = vi.hoisted(() => ({ pathname: '/' }))
const PathnameContext = createContext<string | undefined>(undefined)

// `useSearchParams()` returns `null` when rendered outside a SearchParamsContext
// provider (e.g. `app/global-error` before Next 15.2, or isolated mounts/tests).
// nuqs builds without a `pages/` dir, so it only sees the non-null app-router
// overload — this null path can't surface from types, only by forcing it here.
// The adapter must still expose a non-null `searchParams` (AdapterInterface).
vi.mock('next/navigation.js', () => ({
  default: {},
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => useContext(PathnameContext) ?? route.pathname,
  useSearchParams: () => null
}))

describe('Next App Router Adapter', () => {
  it.each(['/a', '/c'])(
    'cancels a discarded suspended route and accepts updates on %s',
    async destination => {
      globalThrottleQueue.abort()
      const suspended = new Promise<void>(() => {})
      const updateUrl = vi.fn()
      let queued = false
      let abandoned: Promise<URLSearchParams> | undefined
      let currentAdapter: ReturnType<typeof useNuqsNextAppRouterAdapter>
      const originalUrl = location.href
      const originalHistoryState = history.state

      function HistoryUpdater({
        routerState
      }: {
        routerState: { pathname: string }
      }) {
        useInsertionEffect(() => {
          history.replaceState(history.state, '', routerState.pathname)
        }, [routerState])
        return null
      }

      function Page() {
        const pathname = useContext(PathnameContext)
        const adapter = useNuqsNextAppRouterAdapter()
        useEffect(() => {
          currentAdapter = adapter
        }, [adapter])
        if (pathname === '/b') {
          if (!queued) {
            queued = true
            globalThrottleQueue.push({
              key: 'discarded',
              query: 'b',
              options: {}
            })
            abandoned = globalThrottleQueue.flush({
              ...adapter,
              updateUrl,
              getSearchParamsSnapshot: () => new URLSearchParams()
            })
          }
          throw suspended
        }
        return <p>Route {pathname}</p>
      }

      // Stable children allow React to bail out when a suspended /b transition
      // is discarded in favor of the already committed /a context value.
      const children = (
        <>
          <NavigationSpy />
          <Page />
        </>
      )
      function App() {
        const [routerState, setRouterState] = useState({ pathname: '/a' })
        return (
          <>
            <button
              onClick={() =>
                startTransition(() => setRouterState({ pathname: '/b' }))
              }
            >
              Suspend B
            </button>
            <button onClick={() => setRouterState({ pathname: destination })}>
              Abandon B
            </button>
            <button
              onClick={() => {
                globalThrottleQueue.push({
                  key: 'fresh',
                  query: destination,
                  options: {}
                })
                void globalThrottleQueue.flush({
                  ...currentAdapter,
                  updateUrl,
                  getSearchParamsSnapshot: () => new URLSearchParams()
                })
              }}
            >
              Update query
            </button>
            <Suspense fallback="Loading">
              {/* Next commits a new router state to history even if the
                  pathname context and its consumers bail out on the old URL. */}
              <HistoryUpdater routerState={routerState} />
              <PathnameContext.Provider value={routerState.pathname}>
                {children}
              </PathnameContext.Provider>
            </Suspense>
          </>
        )
      }

      try {
        await render(<App />)
        const user = userEvent.setup()
        await user.click(page.getByRole('button', { name: 'Suspend B' }))
        await vi.waitFor(() => expect(queued).toBe(true))
        await new Promise(resolve => setTimeout(resolve, 0))
        expect(updateUrl).not.toHaveBeenCalled()
        await user.click(page.getByRole('button', { name: 'Abandon B' }))
        await expect
          .element(page.getByText(`Route ${destination}`))
          .toBeVisible()
        await user.click(page.getByRole('button', { name: 'Update query' }))
        await vi.waitFor(() => expect(updateUrl).toHaveBeenCalledOnce())
        expect(updateUrl.mock.calls[0]![0].toString()).toBe(
          new URLSearchParams({ fresh: destination }).toString()
        )
        await expect(abandoned).resolves.toEqual(new URLSearchParams())
      } finally {
        globalThrottleQueue.abort()
        history.replaceState(originalHistoryState, '', originalUrl)
      }
    }
  )

  it.each([false, true])(
    'waits for a suspended navigation to commit and respects cancellation (aborted: %s)',
    async aborted => {
      const suspended = new Promise<void>(() => {})
      const controller = new AbortController()
      const flush = vi.fn()
      let queued = false
      const { rerender } = await renderHook(
        (props?: { pathname: string; suspend: boolean }) => {
          const { pathname, suspend } = props!
          route.pathname = pathname
          NavigationSpy()
          const adapter = useNuqsNextAppRouterAdapter()
          if (pathname === '/b' && !queued) {
            adapter.scheduleFlush!(flush, 0, controller.signal)
            queued = true
          }
          if (suspend) {
            throw suspended
          }
          return adapter
        },
        {
          initialProps: { pathname: '/a', suspend: false },
          wrapper: ({ children }) => (
            <Suspense fallback="Loading">{children}</Suspense>
          )
        }
      )
      await rerender({ pathname: '/b', suspend: true })
      await new Promise(resolve => setTimeout(resolve, 0))
      expect(flush).not.toHaveBeenCalled()

      if (aborted) controller.abort()
      await rerender({ pathname: '/b', suspend: false })
      await new Promise(resolve => setTimeout(resolve, 0))
      expect(flush).toHaveBeenCalledTimes(aborted ? 0 : 1)
    }
  )

  it('coalesces a null `useSearchParams()` into a non-null URLSearchParams', async () => {
    const { result } = await renderHook(() => useNuqsNextAppRouterAdapter())
    expect(result.current.searchParams).toBeInstanceOf(URLSearchParams)
    expect(result.current.searchParams.size).toBe(0)
  })
})
