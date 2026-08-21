import { afterEach, describe, expect, it, vi } from 'vitest'
import { version } from '../../lib/version'

describe('adapter context keying across React instances', () => {
  afterEach(() => {
    vi.doUnmock('react')
    vi.resetModules()
    const registry = globalThis as { [key: symbol]: unknown }
    delete registry[Symbol.for(`nuqs.${version}.adapter-context`)]
  })

  it('keeps contexts isolated across distinct createContext identities', async () => {
    const real = await import('./context')
    vi.resetModules()
    vi.doMock('react', async importOriginal => {
      const actual = await importOriginal<typeof import('react')>()
      const createContext: typeof actual.createContext = defaultValue =>
        actual.createContext(defaultValue)
      return { ...actual, createContext }
    })
    const other = await import('./context')
    expect(other.context).not.toBe(real.context)
  })
})
