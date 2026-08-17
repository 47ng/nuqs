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

function Display() {
  const [hello] = useQueryState('hello', parseAsString.withDefault('default'))
  return <span data-testid="value">{hello}</span>
}

function App({ serverSearch }: { serverSearch?: string | URLSearchParams }) {
  return (
    <NuqsAdapter serverSearch={serverSearch}>
      <Display />
    </NuqsAdapter>
  )
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

  it('hydrates deep links without mismatch errors', async () => {
    history.replaceState(null, '', '?hello=world')
    const app = <App serverSearch="?hello=world" />
    const container = document.createElement('div')
    container.innerHTML = renderToString(app)
    document.body.appendChild(container)
    const consoleError = vi.spyOn(console, 'error')
    try {
      const root = await act(() => hydrateRoot(container, app))
      expect(consoleError).not.toHaveBeenCalled()
      expect(
        container.querySelector('[data-testid="value"]')?.textContent
      ).toBe('world')
      await act(() => root.unmount())
    } finally {
      consoleError.mockRestore()
      container.remove()
    }
  })
})
