import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { createBridgeStore, publish, type BridgeStore } from './impl.isolated'
import { PagesBridge } from './impl.isolated.pages'

vi.mock('next/compat/router.js', () => ({
  default: {},
  useRouter: () => ({
    query: { a: '1' },
    events: { on: () => {}, off: () => {} }
  })
}))

describe('Next Pages Router isolated Bridge', () => {
  it('exposes the router query to components rendering after it', async () => {
    const store = createBridgeStore()
    publish(store, new URLSearchParams('a=stale'))
    const seen: (string | undefined)[] = []
    function Probe({ store }: { store: BridgeStore }) {
      seen.push(store.latest?.searchParams.toString())
      return null
    }
    await render(
      <>
        <PagesBridge store={store} />
        <Probe store={store} />
      </>
    )
    expect(seen[0]).toBe('a=1')
    expect(store.committed?.toString()).toBe('a=1')
    expect(store.latest).toBeNull()
  })
})
