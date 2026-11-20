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

async function flushQueuedUpdate(initialEntry: string) {
  const history = createMemoryHistory({ initialEntries: [initialEntry] })
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

  const queue = new ThrottledQueue()
  queue.push({ key: 'query', query: 'updated', options: {} })
  const search = await queue.flush(adapter!)
  return { adapter: adapter!, history, search }
}

it('preserves router-only search params when flushing a queued update', async () => {
  vi.stubGlobal('location', new URL('https://example.com/?browserOnly=ignored'))
  const { adapter, history, search } = await flushQueuedUpdate(
    '/?routerOnly=preserved'
  )

  expect(adapter.searchParams.has('routerOnly')).toBe(false)
  expect(Object.fromEntries(search)).toEqual({
    routerOnly: 'preserved',
    query: 'updated'
  })
  expect(history.location.search).toBe('?routerOnly=preserved&query=updated')
  expect(location.search).toBe('?browserOnly=ignored')
})

it('keeps the raw text of untouched search params when flushing a queued update', async () => {
  const raw = '?tag=a&tag=b&v=1.10&id=12345678901234567890&s="exact"'
  const { history } = await flushQueuedUpdate(`/${raw}`)

  expect(history.location.search).toBe(`${raw}&query=updated`)
})

it('preserves double slashes in search params without collapsing them', async () => {
  const { history } = await flushQueuedUpdate(
    '/?returnUrl=https://example.com/some/path'
  )

  const params = new URLSearchParams(history.location.search)
  expect(params.get('returnUrl')).toBe('https://example.com/some/path')
  expect(params.get('query')).toBe('updated')
})

it('preserves braces in search params without path interpolation', async () => {
  const { history } = await flushQueuedUpdate('/?template={id}')

  const params = new URLSearchParams(history.location.search)
  expect(params.get('template')).toBe('{id}')
  expect(params.get('query')).toBe('updated')
})

it('preserves double slashes and braces when updating a parameter value', async () => {
  const history = createMemoryHistory({ initialEntries: ['/'] })
  const router = createRouter({ routeTree: createRootRoute(), history })
  let adapter: AdapterInterface | undefined

  function Test() {
    adapter = useAdapter(['url', 'pattern'])
    return null
  }

  renderToString(
    <RouterContextProvider router={router}>
      <NuqsAdapter>
        <Test />
      </NuqsAdapter>
    </RouterContextProvider>
  )

  const queue = new ThrottledQueue()
  queue.push({
    key: 'url',
    query: 'https://example.com/api',
    options: {}
  })
  queue.push({
    key: 'pattern',
    query: '{user_id}',
    options: {}
  })
  await queue.flush(adapter!)

  const params = new URLSearchParams(history.location.search)
  expect(params.get('url')).toBe('https://example.com/api')
  expect(params.get('pattern')).toBe('{user_id}')
})
