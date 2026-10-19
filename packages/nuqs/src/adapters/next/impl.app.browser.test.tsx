import React, { Suspense, use } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, renderHook } from 'vitest-browser-react'
import { resetQueues } from '../../lib/queues/reset'
import { globalThrottleQueue } from '../../lib/queues/throttle'
import type { UpdateUrlFunction } from '../lib/defs'
import { NavigationSpy, useNuqsNextAppRouterAdapter } from './impl.app'

const navigation = vi.hoisted(() => ({ pathname: '/' }))

// `useSearchParams()` returns `null` when rendered outside a SearchParamsContext
// provider (e.g. `app/global-error` before Next 15.2, or isolated mounts/tests).
// nuqs builds without a `pages/` dir, so it only sees the non-null app-router
// overload — this null path can't surface from types, only by forcing it here.
// The adapter must still expose a non-null `searchParams` (AdapterInterface).
vi.mock('next/navigation.js', () => ({
  default: {},
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => navigation.pathname,
  useSearchParams: () => null
}))

describe('Next App Router Adapter', () => {
  it('coalesces a null `useSearchParams()` into a non-null URLSearchParams', async () => {
    const { result } = await renderHook(() => useNuqsNextAppRouterAdapter())
    expect(result.current.searchParams).toBeInstanceOf(URLSearchParams)
    expect(result.current.searchParams.size).toBe(0)
  })
})

describe('Next App Router Adapter: route commits', () => {
  const originalUrl = location.href
  const options = { history: 'replace', scroll: false, shallow: true } as const
  const neverResolves = new Promise<never>(() => {})
  const getFrom = () => new URLSearchParams(location.search).get('from')

  afterEach(async () => {
    await cleanup()
    navigation.pathname = '/'
    resetQueues()
    history.replaceState(history.state, '', originalUrl)
  })

  async function renderSuspendedRoute(pathname: string) {
    let updateUrl!: UpdateUrlFunction
    function SuspendedRoute() {
      updateUrl = useNuqsNextAppRouterAdapter().updateUrl
      use(neverResolves)
      return null
    }
    navigation.pathname = pathname
    await render(
      <Suspense>
        <SuspendedRoute />
      </Suspense>
    )
    return updateUrl
  }

  it('does not write the URL from a route that has not committed yet', async () => {
    navigation.pathname = '/a'
    await render(<NavigationSpy />)
    const updateUrl = await renderSuspendedRoute('/b')
    updateUrl(new URLSearchParams('?from=b'), options)
    expect(getFrom()).toBeNull()
  })

  it('writes the URL from an uncommitted hook on the committed route', async () => {
    navigation.pathname = '/a'
    await render(<NavigationSpy />)
    const updateUrl = await renderSuspendedRoute('/a')
    updateUrl(new URLSearchParams('?from=a'), options)
    expect(getFrom()).toBe('a')
  })

  it('clears skipped updates once their route commits', async () => {
    function Route({ pathname }: { pathname: string }) {
      const { updateUrl } = useNuqsNextAppRouterAdapter()
      if (pathname === '/b' && !globalThrottleQueue.updateMap.has('from')) {
        globalThrottleQueue.push({ key: 'from', query: 'b', options: {} })
        updateUrl(new URLSearchParams('?from=b'), options)
      }
      return null
    }
    function Router() {
      return (
        <>
          <NavigationSpy />
          <Route key={navigation.pathname} pathname={navigation.pathname} />
        </>
      )
    }
    navigation.pathname = '/a'
    const { rerender } = await render(<Router />)
    navigation.pathname = '/b'
    await rerender(<Router />)
    expect(getFrom()).toBeNull()
    await Promise.resolve()
    expect(globalThrottleQueue.getQueuedQuery('from')).toBeUndefined()
  })

  it('writes the URL from a committed hook after the route changed', async () => {
    let updateUrl!: UpdateUrlFunction
    function Layout() {
      updateUrl = useNuqsNextAppRouterAdapter().updateUrl
      return <NavigationSpy />
    }
    navigation.pathname = '/a'
    const { rerender } = await render(<Layout />)
    navigation.pathname = '/b'
    await rerender(<Layout />)
    updateUrl(new URLSearchParams('?from=layout'), options)
    expect(getFrom()).toBe('layout')
  })
})
