import { afterEach, describe, expect, it, vi } from 'vitest'
import { debugMessages } from './debug-messages'

async function loadSafeParse() {
  vi.resetModules()
  vi.stubEnv('DEBUG', 'nuqs')
  await import('../debug')
  return import('./safe-parse')
}

describe('safeParse', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('reports the key when parsing fails', async () => {
    const { safeParse } = await loadSafeParse()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const cause = new Error('boom')

    expect(
      safeParse(
        () => {
          throw cause
        },
        'value',
        'key'
      )
    ).toBeNull()
    expect(warn).toHaveBeenCalledExactlyOnceWith(
      debugMessages[25],
      'value',
      cause,
      'key'
    )
  })

  it('reports parsing failures without a key', async () => {
    const { safeParse } = await loadSafeParse()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const cause = new Error('boom')

    expect(
      safeParse(() => {
        throw cause
      }, 'value')
    ).toBeNull()
    expect(warn).toHaveBeenCalledExactlyOnceWith(
      debugMessages[24],
      'value',
      cause
    )
  })
})
