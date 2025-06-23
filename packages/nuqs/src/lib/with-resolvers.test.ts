import { describe, expect, it } from 'vitest'
import { withResolvers } from './with-resolvers'

describe('utils: withResolvers', () => {
  it('supports built-in Promise.withResolvers', async () => {
    expect('withResolvers' in Promise).toBe(true)
    const resolving = withResolvers()
    expect(resolving.promise).toBeInstanceOf(Promise)
    expect(resolving.resolve).toBeInstanceOf(Function)
    expect(resolving.reject).toBeInstanceOf(Function)
    resolving.resolve('foo')
    await expect(resolving.promise).resolves.toBe('foo')
    const rejecting = withResolvers()
    rejecting.reject('bar')
    await expect(rejecting.promise).rejects.toBe('bar')
  })
  it('polyfills when support is not available', async () => {
    if ('withResolvers' in Promise) {
      // @ts-expect-error
      delete Promise.withResolvers
    }
    expect('withResolvers' in Promise).toBe(false)
    const resolving = withResolvers()
    expect(resolving.promise).toBeInstanceOf(Promise)
    expect(resolving.resolve).toBeInstanceOf(Function)
    expect(resolving.reject).toBeInstanceOf(Function)
    resolving.resolve('foo')
    await expect(resolving.promise).resolves.toBe('foo')
    const rejecting = withResolvers()
    rejecting.reject('bar')
    await expect(rejecting.promise).rejects.toBe('bar')
  })
})
