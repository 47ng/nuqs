import { afterEach, describe, expect, it, vi } from 'vitest'

// The default throttle is computed when the module loads,
// so each case imports a fresh copy with its own browser globals.
async function getDefaultThrottleTime(browser?: {
  safari: boolean
  userAgent?: string
}) {
  if (browser) {
    vi.stubGlobal('window', browser.safari ? { GestureEvent: class {} } : {})
    vi.stubGlobal('navigator', { userAgent: browser.userAgent })
  }
  vi.resetModules()
  const { defaultRateLimit } = await import('./rate-limiting')
  return defaultRateLimit.timeMs
}

const safari = (version: string) =>
  `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${version} Safari/605.1.15`

describe('rate-limiting: default throttle', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('throttles by 50ms on the server', async () => {
    expect(await getDefaultThrottleTime()).toBe(50)
  })

  it('throttles by 50ms in browsers other than Safari', async () => {
    expect(
      await getDefaultThrottleTime({ safari: false, userAgent: safari('17.4') })
    ).toBe(50)
  })

  it.each([
    { version: '17.4', expected: 120 },
    { version: '17', expected: 120 },
    { version: '16.6', expected: 320 }
  ])(
    'throttles by $expected ms in Safari $version',
    async ({ version, expected }) => {
      expect(
        await getDefaultThrottleTime({
          safari: true,
          userAgent: safari(version)
        })
      ).toBe(expected)
    }
  )

  it('throttles by 320ms in Safari when its version is unknown', async () => {
    expect(
      await getDefaultThrottleTime({ safari: true, userAgent: 'Safari' })
    ).toBe(320)
  })
})
