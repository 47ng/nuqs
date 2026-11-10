import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterContextProvider
} from '@tanstack/react-router'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { afterEach, expect, it, vi } from 'vitest'
import { ThrottledQueue } from '../lib/queues/throttle'
import { useAdapter } from './lib/context'
import type { AdapterInterface } from './lib/defs'
import { NuqsAdapter } from './tanstack-router'

afterEach(() => vi.unstubAllGlobals())

it('preserves router-only search params when flushing a queued update', async () => {
  vi.stubGlobal('location', new URL('https://example.com/?browserOnly=ignored'))
  const history = createMemoryHistory({
    initialEntries: ['/?routerOnly=preserved']
  })
  const router = createRouter({ routeTree: createRootRoute(), history })
  let adapter: AdapterInterface | undefined

  function Test() {
    adapter = useAdapter(['query'])
    return null
  }

  renderToString(
    <RouterContextProvider router={router}>
      <NuqsAdapter>
        <Test />
      </NuqsAdapter>
    </RouterContextProvider>
  )
  expect(adapter!.searchParams.has('routerOnly')).toBe(false)

  const queue = new ThrottledQueue()
  queue.push({ key: 'query', query: 'updated', options: {} })
  const search = await queue.flush(adapter!)

  expect(Object.fromEntries(search)).toEqual({
    routerOnly: 'preserved',
    query: 'updated'
  })
  expect(history.location.search).toBe('?routerOnly=preserved&query=updated')
  expect(location.search).toBe('?browserOnly=ignored')
})
