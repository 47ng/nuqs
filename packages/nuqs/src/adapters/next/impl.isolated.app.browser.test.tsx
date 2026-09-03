import React, { Activity, act, useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, renderHook } from 'vitest-browser-react'
import { createBridgeStore, type BridgeStore } from './impl.isolated'
import {
  AppBridge,
  useAppBridgeStore,
  useNuqsNextAppRouterIsolatedAdapter,
  type AppBridgeStore
} from './impl.isolated.app'

const replace = vi.fn()
const route = vi.hoisted(() => ({ pathname: '/route', search: 'a=1' }))

vi.mock('next/navigation.js', () => ({
  default: {},
  useRouter: () => ({ replace }),
  usePathname: () => route.pathname,
  useSearchParams: () => new URLSearchParams(route.search)
}))

beforeEach(() => {
  replace.mockClear()
  route.pathname = '/route'
  route.search = 'a=1'
})

function readLatest(store: BridgeStore): string | null {
  return store.latest && `${store.latest.pathname}?${store.latest.searchParams}`
}

describe('Next App Router isolated Bridge', () => {
  it('exposes its render-phase view, then publishes it with its pathname', async () => {
    const store = createBridgeStore()
    const seen: (string | null)[] = []
    function Probe() {
      seen.push(readLatest(store))
      return null
    }
    await render(
      <>
        <AppBridge store={store} />
        <Probe />
      </>
    )
    expect(seen[0]).toBe('/route?a=1')
    expect(store.committed?.toString()).toBe('a=1')
    expect(store.committedPathname).toBe('/route')
    expect(store.latest).toBeNull()
  })
})

describe('Next App Router isolated adapter', () => {
  it('calls the router for deep updates before the Bridge has mounted', async () => {
    const { result } = await renderHook(() =>
      useNuqsNextAppRouterIsolatedAdapter(useAppBridgeStore(), ['test'])
    )
    try {
      result.current.updateUrl(new URLSearchParams('test=pass'), {
        history: 'replace',
        scroll: false,
        shallow: false
      })
      expect(replace).toHaveBeenCalledExactlyOnceWith(
        expect.stringContaining('?test=pass'),
        { scroll: false }
      )
    } finally {
      history.replaceState(null, '', location.pathname)
    }
  })

  it('reads the destination params when a hidden page is revealed', async () => {
    const seen: string[] = []
    let navigate = (_pathname: string, _search: string) => {}
    function Page({ store }: { store: AppBridgeStore }) {
      const { searchParams } = useNuqsNextAppRouterIsolatedAdapter(store, ['a'])
      seen.push(searchParams.toString())
      return null
    }
    function App() {
      const store = useAppBridgeStore()
      const [, rerender] = useState(0)
      navigate = (pathname, search) => {
        route.pathname = pathname
        route.search = search
        rerender(n => n + 1)
      }
      return (
        <>
          <AppBridge store={store} />
          <Activity mode={route.pathname === '/route' ? 'visible' : 'hidden'}>
            <Page store={store} />
          </Activity>
        </>
      )
    }
    await render(<App />)
    expect(seen.at(-1)).toBe('a=1')
    await act(() => navigate('/elsewhere', 'a=2'))
    seen.length = 0
    await act(() => navigate('/route', 'a=3'))
    expect(seen[0]).toBe('a=3')
  })

  it('leaves the router alone for shallow updates', async () => {
    const { result } = await renderHook(() =>
      useNuqsNextAppRouterIsolatedAdapter(useAppBridgeStore(), ['test'])
    )
    try {
      result.current.updateUrl(new URLSearchParams('test=pass'), {
        history: 'push',
        scroll: false,
        shallow: true
      })
      expect(location.search).toBe('?test=pass')
      expect(replace).not.toHaveBeenCalled()
    } finally {
      history.replaceState(null, '', location.pathname)
    }
  })
})
