import React, { act, type ReactNode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it, vi, type Mock } from 'vitest'
import { parseAsString } from '../parsers'
import { useQueryState } from '../useQueryState'
import { NuqsAdapter } from './react'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true

type ServerSearch = string | URLSearchParams

type DisplayProps = {
  queryKey?: string
  onRender?: (value: string) => void
}

function Display({ queryKey = 'hello', onRender }: DisplayProps) {
  const [value] = useQueryState(queryKey, parseAsString.withDefault('default'))
  onRender?.(value)
  return <span data-testid={queryKey}>{value}</span>
}

function App({
  serverSearch,
  children = <Display />
}: {
  serverSearch?: ServerSearch
  children?: ReactNode
}) {
  return <NuqsAdapter serverSearch={serverSearch}>{children}</NuqsAdapter>
}

async function hydrate(app: React.ReactElement, ...onRenderSpies: Mock[]) {
  const container = document.createElement('div')
  container.innerHTML = renderToString(app)
  onRenderSpies.forEach(spy => spy.mockClear())
  document.body.appendChild(container)
  const consoleError = vi.spyOn(console, 'error')
  const onRecoverableError = vi.fn()
  const root = await act(() =>
    hydrateRoot(container, app, { onRecoverableError })
  )
  return {
    consoleError,
    onRecoverableError,
    textContent: (queryKey = 'hello') =>
      container.querySelector(`[data-testid="${queryKey}"]`)?.textContent,
    async cleanup() {
      consoleError.mockRestore()
      await act(() => root.unmount())
      container.remove()
    }
  }
}

describe('adapters/react: serverSearch', () => {
  const initialUrl = location.href
  afterEach(() => {
    history.replaceState(null, '', initialUrl)
  })

  it('renders default values on the server when not provided', () => {
    const html = renderToString(<App />)
    expect(html).toContain('default')
  })

  it('seeds server-side rendering from a search string', () => {
    const html = renderToString(<App serverSearch="?hello=world" />)
    expect(html).toContain('world')
  })

  it('accepts a search string without the leading `?`', () => {
    const html = renderToString(<App serverSearch="hello=world" />)
    expect(html).toContain('world')
  })

  it('seeds server-side rendering from URLSearchParams', () => {
    const html = renderToString(
      <App serverSearch={new URLSearchParams({ hello: 'world' })} />
    )
    expect(html).toContain('world')
  })

  it('hydrates deep links from the server snapshot, without a flash of defaults', async () => {
    history.replaceState(null, '', '?hello=world')
    const onRender = vi.fn()
    const { consoleError, onRecoverableError, textContent, cleanup } =
      await hydrate(
        <App serverSearch="?hello=world">
          <Display onRender={onRender} />
        </App>,
        onRender
      )
    try {
      expect(consoleError).not.toHaveBeenCalled()
      expect(onRecoverableError).not.toHaveBeenCalled()
      expect(onRender).not.toHaveBeenCalledWith('default')
      expect(textContent()).toBe('world')
    } finally {
      await cleanup()
    }
  })

  it('re-syncs to the location after hydrating from a stale server snapshot', async () => {
    history.replaceState(null, '', '?hello=client')
    const onRender = vi.fn()
    const { consoleError, onRecoverableError, textContent, cleanup } =
      await hydrate(
        <App serverSearch="?hello=server">
          <Display onRender={onRender} />
        </App>,
        onRender
      )
    try {
      expect(consoleError).not.toHaveBeenCalled()
      expect(onRecoverableError).not.toHaveBeenCalled()
      expect(onRender).toHaveBeenNthCalledWith(1, 'server')
      expect(textContent()).toBe('client')
    } finally {
      await cleanup()
    }
  })

  it('hydrates from default values when not provided, then re-syncs to the location', async () => {
    history.replaceState(null, '', '?hello=world')
    const onRender = vi.fn()
    const { consoleError, onRecoverableError, textContent, cleanup } =
      await hydrate(
        <App>
          <Display onRender={onRender} />
        </App>,
        onRender
      )
    try {
      expect(consoleError).not.toHaveBeenCalled()
      expect(onRecoverableError).not.toHaveBeenCalled()
      expect(onRender).toHaveBeenNthCalledWith(1, 'default')
      expect(textContent()).toBe('world')
    } finally {
      await cleanup()
    }
  })

  it('hydrates each hook from its own keys, and keeps key isolation afterwards', async () => {
    history.replaceState(null, '', '?a=1&b=2')
    const onRenderA = vi.fn()
    const onRenderB = vi.fn()
    const { consoleError, onRecoverableError, textContent, cleanup } =
      await hydrate(
        <App serverSearch="?a=1&b=2">
          <Display queryKey="a" onRender={onRenderA} />
          <Display queryKey="b" onRender={onRenderB} />
        </App>,
        onRenderA,
        onRenderB
      )
    try {
      expect(consoleError).not.toHaveBeenCalled()
      expect(onRecoverableError).not.toHaveBeenCalled()
      expect(onRenderA).not.toHaveBeenCalledWith('default')
      expect(onRenderB).not.toHaveBeenCalledWith('default')
      onRenderA.mockClear()
      onRenderB.mockClear()
      await act(() => {
        history.replaceState(null, '', '?a=1&b=3')
        window.dispatchEvent(new PopStateEvent('popstate'))
      })
      expect(onRenderA).not.toHaveBeenCalled()
      expect(onRenderB).toHaveBeenLastCalledWith('3')
      expect(textContent('a')).toBe('1')
      expect(textContent('b')).toBe('3')
    } finally {
      await cleanup()
    }
  })
})
