import React, { useSyncExternalStore } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { unstable_createAdapterProvider } from './adapters/custom'
import { renderQueryString } from './lib/url-encoding'
import { resetQueues } from './lib/queues/reset'
import { parseAsString } from './parsers'
import { useQueryStates } from './useQueryStates'

// Adapter whose search params only follow the URL when told to,
// like routers that apply URL updates in a transition.
let adapterSearchParams = new URLSearchParams()
const listeners = new Set<() => void>()
function catchUpWithUrl() {
  adapterSearchParams = new URLSearchParams(location.search)
  listeners.forEach(listener => listener())
}
const LaggingAdapter = unstable_createAdapterProvider(() => ({
  searchParams: useSyncExternalStore(
    listener => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => adapterSearchParams
  ),
  updateUrl(search) {
    history.replaceState(null, '', renderQueryString(search))
  },
  autoResetQueueOnUpdate: false
}))

const urlValue = (key: string) => new URLSearchParams(location.search).get(key)

const click = (testId: string) =>
  page
    .getByTestId(testId)
    .element()
    .dispatchEvent(new MouseEvent('click', { bubbles: true }))

function Probe() {
  const [{ a }, setValues] = useQueryStates({
    a: parseAsString,
    b: parseAsString
  })
  return (
    <>
      <button
        data-testid="write-a"
        onClick={() => void setValues({ a: 'item-1' })}
      />
      <button
        data-testid="write-b"
        onClick={() => void setValues({ b: 'x' })}
      />
      <output data-testid="a">{a}</output>
    </>
  )
}

describe('useQueryStates: adapter lagging behind the URL', () => {
  const originalUrl = location.href

  afterEach(async () => {
    await cleanup()
    resetQueues()
    history.replaceState(history.state, '', originalUrl)
  })

  async function writeAThenB() {
    catchUpWithUrl()
    await render(
      <LaggingAdapter>
        <Probe />
      </LaggingAdapter>
    )
    await click('write-a')
    await expect.poll(() => urlValue('a')).toBe('item-1')
    await click('write-b')
    await expect.poll(() => urlValue('b')).toBe('x')
  }

  // Regression for https://github.com/47ng/nuqs/issues/1612
  it('keeps a flushed value while the adapter has not caught up', async () => {
    await writeAThenB()
    await expect.element(page.getByTestId('a')).toHaveTextContent('item-1')
    catchUpWithUrl()
    await expect.element(page.getByTestId('a')).toHaveTextContent('item-1')
  })

  it('syncs to an external URL change once the adapter catches up', async () => {
    await writeAThenB()
    const search = new URLSearchParams(location.search)
    search.set('a', 'other')
    history.replaceState(null, '', `?${search}`)
    catchUpWithUrl()
    await expect.element(page.getByTestId('a')).toHaveTextContent('other')
  })
})
