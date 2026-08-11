import React, { type PropsWithChildren } from 'react'
import { describe, expect, it } from 'vitest'
import { renderHook } from 'vitest-browser-react'
import { useQueryState } from '../useQueryState'
import { debounce } from '../lib/queues/rate-limiting'
import { NuqsAdapter } from './react'

const wrapper = ({ children }: PropsWithChildren) => (
  <NuqsAdapter>{children}</NuqsAdapter>
)

describe('React adapter', () => {
  it('cancels a pending debounced update on browser back', async () => {
    const originalUrl = location.href
    const selectedUrl = new URL(originalUrl)
    selectedUrl.search = '?q=selected'
    const currentUrl = new URL(originalUrl)
    currentUrl.search = '?q=current'

    history.replaceState(null, '', selectedUrl)
    history.pushState(null, '', currentUrl)

    try {
      const { result, act } = await renderHook(() => useQueryState('q'), {
        wrapper
      })
      expect(result.current[0]).toBe('current')

      await act(async () => {
        result.current[1]('pending', {
          limitUrlUpdates: debounce(100)
        })
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      expect(result.current[0]).toBe('pending')
      expect(location.search).toBe('?q=current')

      const didPopState = new Promise<void>(resolve =>
        window.addEventListener('popstate', () => resolve(), { once: true })
      )
      await act(async () => {
        history.back()
        await didPopState
      })
      await act(() => new Promise(resolve => setTimeout(resolve, 150)))

      expect(location.search).toBe('?q=selected')
      expect(result.current[0]).toBe('selected')
    } finally {
      history.replaceState(null, '', originalUrl)
    }
  })
})
