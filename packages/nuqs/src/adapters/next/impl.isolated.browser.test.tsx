import { act } from 'react'
import { describe, expect, it } from 'vitest'
import { renderHook } from 'vitest-browser-react'
import {
  createBridgeStore,
  publish,
  useIsolatedSearchParams
} from './impl.isolated'

describe('impl.isolated: useIsolatedSearchParams', () => {
  it('keeps the snapshot identity when unwatched keys change', async () => {
    const store = createBridgeStore()
    publish(store, new URLSearchParams('?a=1&b=2'))
    const { result } = await renderHook(() =>
      useIsolatedSearchParams(store, ['a'], {})
    )
    const first = result.current
    expect(first.toString()).toBe('a=1')
    act(() => publish(store, new URLSearchParams('?a=1&b=changed')))
    expect(result.current).toBe(first)
  })
  it('re-renders with a new snapshot when a watched key changes', async () => {
    const store = createBridgeStore()
    publish(store, new URLSearchParams('?a=1&b=2'))
    const { result } = await renderHook(() =>
      useIsolatedSearchParams(store, ['a'], {})
    )
    act(() => publish(store, new URLSearchParams('?a=changed&b=2')))
    expect(result.current.toString()).toBe('a=changed')
  })
  it('re-checks a watched key removed before the first publish', async () => {
    const store = createBridgeStore()
    // Simulate the pre-Bridge window: the hook mounts against the live
    // location fallback (no committed params yet).
    history.replaceState(null, '', '?a=stale')
    try {
      const { result } = await renderHook(() =>
        useIsolatedSearchParams(store, ['a'], {})
      )
      expect(result.current.toString()).toBe('a=stale')
      act(() => publish(store, new URLSearchParams('')))
      expect(result.current.toString()).toBe('')
    } finally {
      history.replaceState(null, '', location.pathname)
    }
  })
  it('reads the render-phase holder before commit, then self-heals to committed', async () => {
    const store = createBridgeStore()
    publish(store, new URLSearchParams('?a=committed'))
    store.latest = {
      pathname: '/destination',
      searchParams: new URLSearchParams('?a=in-flight')
    }
    const values: string[] = []
    const { result } = await renderHook(() => {
      const searchParams = useIsolatedSearchParams(store, ['a'], {
        pathname: '/destination'
      })
      values.push(searchParams.toString())
      return searchParams
    })
    // Pre-commit snapshots adopt the Bridge's render-phase holder…
    expect(values[0]).toBe('a=in-flight')
    // …and since no Bridge commit confirmed it (in the real flow the Bridge's
    // layout-effect publish updates `committed` in the same commit), the
    // subscription-time consistency check reverts to the committed params.
    expect(result.current.toString()).toBe('a=committed')
  })
  it('ignores the render-phase holder when pathnames differ', async () => {
    const store = createBridgeStore()
    publish(store, new URLSearchParams('?a=committed'))
    store.latest = {
      pathname: '/elsewhere',
      searchParams: new URLSearchParams('?a=in-flight')
    }
    const values: string[] = []
    await renderHook(() => {
      const searchParams = useIsolatedSearchParams(store, ['a'], {
        pathname: '/destination'
      })
      values.push(searchParams.toString())
      return searchParams
    })
    expect(values[0]).toBe('a=committed')
  })
  it('tracks watched key subscriptions with reference counts', async () => {
    const store = createBridgeStore()
    publish(store, new URLSearchParams(''))
    const a = await renderHook(() => useIsolatedSearchParams(store, ['x'], {}))
    const b = await renderHook(() => useIsolatedSearchParams(store, ['x'], {}))
    expect(store.watched.get('x')).toBe(2)
    a.unmount()
    expect(store.watched.get('x')).toBe(1)
    b.unmount()
    expect(store.watched.has('x')).toBe(false)
  })
})
