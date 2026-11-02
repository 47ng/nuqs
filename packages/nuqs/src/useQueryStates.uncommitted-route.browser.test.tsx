import React, { Suspense, use } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { unstable_createAdapterProvider } from './adapters/custom'
import { resetQueues } from './lib/queues/reset'
import { renderQueryString } from './lib/url-encoding'
import { useQueryState } from './useQueryState'

// A hook rendering for a route that has not committed yet must not update the
// URL, nor the other hooks, until it mounts: that render may never commit (#1358).
const writes: string[] = []
const Adapter = unstable_createAdapterProvider(() => ({
  searchParams: new URLSearchParams(location.search),
  updateUrl(search) {
    writes.push(search.toString())
    history.replaceState(null, '', renderQueryString(search))
  },
  autoResetQueueOnUpdate: false
}))

const neverResolves = new Promise<never>(() => {})
const resolutions: string[] = []

function Observer() {
  const [mode] = useQueryState('mode')
  return <output data-testid="observer">{mode ?? 'null'}</output>
}

// Writes a default during render, like #1358 (and only once, like a
// `useRef`-guarded initialisation).
function Destination({ suspend }: { suspend: boolean }) {
  const [, setMode] = useQueryState('mode')
  const [initialised] = React.useState(() => {
    void setMode('default').then(search => resolutions.push(search.toString()))
    return true
  })
  if (suspend) {
    use(neverResolves)
  }
  return <p data-testid="destination">{String(initialised)}</p>
}

const urlMode = () => new URLSearchParams(location.search).get('mode')

describe('useQueryStates: setters called before the route commits', () => {
  const originalUrl = location.href

  afterEach(async () => {
    await cleanup()
    resetQueues()
    writes.length = 0
    resolutions.length = 0
    history.replaceState(history.state, '', originalUrl)
  })

  it('does not update the URL nor the other hooks while the route has not committed', async () => {
    await render(
      <Adapter>
        <Observer />
        <Suspense>
          <Destination suspend />
        </Suspense>
      </Adapter>
    )
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(writes).toEqual([])
    expect(urlMode()).toBeNull()
    await expect.element(page.getByTestId('observer')).toHaveTextContent('null')
    // Setter Promises resolve with the URL as it is (React may retry the
    // suspended render, calling the setter again).
    expect(resolutions.length).toBeGreaterThan(0)
    for (const resolution of resolutions) {
      expect(resolution).toBe(location.search.slice(1))
    }
  })

  it('applies the setter calls once the route mounts', async () => {
    await render(
      <Adapter>
        <Observer />
        <Destination suspend={false} />
      </Adapter>
    )
    await expect.poll(urlMode).toBe('default')
    await expect
      .element(page.getByTestId('observer'))
      .toHaveTextContent('default')
    expect(writes).toHaveLength(1)
    expect(new URLSearchParams(writes[0]).get('mode')).toBe('default')
  })
})
