import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, renderHook } from 'vitest-browser-react'
import { createBridgeStore, type BridgeStore } from './impl.isolated'
import {
  AppBridge,
  useAppBridgeStore,
  useNuqsNextAppRouterIsolatedAdapter
} from './impl.isolated.app'

const replace = vi.fn()

vi.mock('next/navigation.js', () => ({
  default: {},
  useRouter: () => ({ replace }),
  usePathname: () => '/route',
  useSearchParams: () => new URLSearchParams('a=1')
}))

beforeEach(() => {
  replace.mockClear()
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
