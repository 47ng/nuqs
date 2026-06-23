import { describe, expect, it, vi } from 'vitest'
import { renderHook } from 'vitest-browser-react'
import { useNuqsNextAppRouterAdapter } from './impl.app'

// `useSearchParams()` returns `null` when rendered outside a SearchParamsContext
// provider (e.g. `app/global-error` before Next 15.2, or isolated mounts/tests).
// nuqs builds without a `pages/` dir, so it only sees the non-null app-router
// overload — this null path can't surface from types, only by forcing it here.
// The adapter must still expose a non-null `searchParams` (AdapterInterface).
vi.mock('next/navigation.js', () => ({
  default: {},
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => null
}))

describe('Next App Router Adapter', () => {
  it('coalesces a null `useSearchParams()` into a non-null URLSearchParams', async () => {
    const { result } = await renderHook(() => useNuqsNextAppRouterAdapter())
    expect(result.current.searchParams).toBeInstanceOf(URLSearchParams)
    expect(result.current.searchParams.size).toBe(0)
  })
})
