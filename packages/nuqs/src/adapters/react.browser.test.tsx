import React, { act } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { parseAsString } from '../parsers'
import { useQueryState } from '../useQueryState'
import { NuqsAdapter } from './react'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true

type AppProps = {
  serverSearch?: string | URLSearchParams
  onRender?: (value: string) => void
}

function Display({ onRender }: Pick<AppProps, 'onRender'>) {
  const [hello] = useQueryState('hello', parseAsString.withDefault('default'))
  onRender?.(hello)
  return <span data-testid="value">{hello}</span>
}

function App({ serverSearch, onRender }: AppProps) {
  return (
    <NuqsAdapter serverSearch={serverSearch}>
      <Display onRender={onRender} />
    </NuqsAdapter>
  )
}

async function hydrate(serverSearch: string) {
  const renders: string[] = []
  const app = (
    <App serverSearch={serverSearch} onRender={value => renders.push(value)} />
  )
  const container = document.createElement('div')
  container.innerHTML = renderToString(app)
  document.body.appendChild(container)
  renders.length = 0
  const consoleError = vi.spyOn(console, 'error')
  const root = await act(() => hydrateRoot(container, app))
  return {
    renders,
    consoleError,
    textContent: container.querySelector('[data-testid="value"]')?.textContent,
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
    const { renders, consoleError, textContent, cleanup } =
      await hydrate('?hello=world')
    try {
      expect(consoleError).not.toHaveBeenCalled()
      expect(renders).not.toContain('default')
      expect(textContent).toBe('world')
    } finally {
      await cleanup()
    }
  })

  it('re-syncs to the location after hydrating from a stale server snapshot', async () => {
    history.replaceState(null, '', '?hello=client')
    const { renders, consoleError, textContent, cleanup } =
      await hydrate('?hello=server')
    try {
      expect(consoleError).not.toHaveBeenCalled()
      expect(renders[0]).toBe('server')
      expect(textContent).toBe('client')
    } finally {
      await cleanup()
    }
  })
})
