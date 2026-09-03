import { afterEach, describe, expect, it, vi } from 'vitest'

async function loadDefaultRateLimit() {
  vi.resetModules()
  return (await import('./rate-limiting')).defaultRateLimit
}

describe('rate-limiting: browser defaults', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('uses the standard rate limit outside Safari', async () => {
    vi.stubGlobal('window', {})

    await expect(loadDefaultRateLimit()).resolves.toEqual({
      method: 'throttle',
      timeMs: 50
    })
  })

  it('uses the legacy Safari rate limit before version 17', async () => {
    vi.stubGlobal('window', { GestureEvent: class GestureEvent {} })
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 Version/16.6 Safari/605.1.15'
    })

    await expect(loadDefaultRateLimit()).resolves.toEqual({
      method: 'throttle',
      timeMs: 320
    })
  })

  it('uses the relaxed Safari rate limit from version 17', async () => {
    vi.stubGlobal('window', { GestureEvent: class GestureEvent {} })
    vi.stubGlobal('navigator', {
      userAgent: 'Mozilla/5.0 Version/17.0 Safari/605.1.15'
    })

    await expect(loadDefaultRateLimit()).resolves.toEqual({
      method: 'throttle',
      timeMs: 120
    })
  })
})
