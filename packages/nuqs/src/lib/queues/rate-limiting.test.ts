import { afterEach, describe, expect, it, vi } from 'vitest'

// The default throttle is computed when the module loads,
// so each case stubs the browser globals and imports a fresh copy.
async function getDefaultThrottleInSafari(userAgent: string) {
  vi.stubGlobal('window', { GestureEvent: class {} })
  vi.stubGlobal('navigator', { userAgent })
  vi.resetModules()
  const { defaultRateLimit } = await import('./rate-limiting')
  return defaultRateLimit.timeMs
}

describe('rate-limiting: default throttle in Safari', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it.each([
    {
      device: 'macOS',
      version: '17.4',
      expected: 120,
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15'
    },
    {
      device: 'iPhone',
      version: '17.4',
      expected: 120,
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
    },
    {
      device: 'iPad',
      version: '18.0',
      expected: 120,
      userAgent:
        'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
    },
    {
      device: 'iPhone',
      version: '16.6',
      expected: 320,
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1'
    }
  ])(
    'throttles by $expected ms in Safari $version on $device',
    async ({ userAgent, expected }) => {
      expect(await getDefaultThrottleInSafari(userAgent)).toBe(expected)
    }
  )
})
