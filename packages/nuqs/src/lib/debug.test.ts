import { afterEach, describe, expect, it, vi } from 'vitest'
import { addDebugSink, debug, isDebugFlagSet, warn } from './debug'
import { sprintf } from './debug-messages'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('debug/sink registry', () => {
  it('does nothing and leaves args untouched when no sink is registered', () => {
    const arg = { a: 1 }
    expect(() => debug(6, 'id', 'key', arg)).not.toThrow()
    expect(arg).toEqual({ a: 1 })
  })

  it('forwards code, args and warn flag to a registered sink', () => {
    const sink = vi.fn()
    const remove = addDebugSink(sink)
    const cause = new Error('boom')
    debug(6, 'id', 'key', { a: 1 })
    warn(24, 'value', cause)
    expect(sink).toHaveBeenNthCalledWith(1, 6, ['id', 'key', { a: 1 }])
    expect(sink).toHaveBeenNthCalledWith(2, 24, ['value', cause], true)
    remove()
  })

  it('fans out to every registered sink', () => {
    const a = vi.fn()
    const b = vi.fn()
    const removeA = addDebugSink(a)
    const removeB = addDebugSink(b)
    debug(8)
    expect(a).toHaveBeenCalledOnce()
    expect(b).toHaveBeenCalledOnce()
    removeA()
    removeB()
  })

  it('stops calling a sink after its remover runs', () => {
    const sink = vi.fn()
    const remove = addDebugSink(sink)
    debug(8)
    remove()
    debug(8)
    expect(sink).toHaveBeenCalledOnce()
  })
})

describe('debug/server (DEBUG env)', () => {
  it('enables when DEBUG includes nuqs', () => {
    vi.stubEnv('DEBUG', 'nuqs')
    expect(isDebugFlagSet()).toBe(true)
  })

  it('enables when DEBUG contains nuqs among others', () => {
    vi.stubEnv('DEBUG', '*,nuqs,other')
    expect(isDebugFlagSet()).toBe(true)
  })

  it('disables when DEBUG is unset', () => {
    vi.stubEnv('DEBUG', '')
    expect(isDebugFlagSet()).toBe(false)
  })

  it('disables when DEBUG does not include nuqs', () => {
    vi.stubEnv('DEBUG', 'other,*')
    expect(isDebugFlagSet()).toBe(false)
  })
})

describe('debug/sprintf', () => {
  it('formats strings with %s', () => {
    expect(sprintf('%s', 'foo')).toBe('foo')
    expect(sprintf('%s', 1)).toBe('1')
    expect(sprintf('%s', true)).toBe('true')
    expect(sprintf('%s', null)).toBe('null')
    expect(sprintf('%s', undefined)).toBe('undefined')
    expect(sprintf('%s', {})).toBe('[object Object]')
    expect(sprintf('%s', [])).toBe('')
  })
  it('formats integers with %d', () => {
    expect(sprintf('%d', 1)).toBe('1')
    expect(sprintf('%d', 1.5)).toBe('1.5')
    expect(sprintf('%d', '1')).toBe('1')
    expect(sprintf('%d', '1.5')).toBe('1.5')
    expect(sprintf('%d', true)).toBe('true')
    expect(sprintf('%d', false)).toBe('false')
    expect(sprintf('%d', null)).toBe('null')
    expect(sprintf('%d', undefined)).toBe('undefined')
    expect(sprintf('%d', {})).toBe('[object Object]')
    expect(sprintf('%d', [])).toBe('')
  })
  it('formats floats with %f', () => {
    expect(sprintf('%f', 1)).toBe('1')
    expect(sprintf('%f', 1.5)).toBe('1.5')
    expect(sprintf('%f', '1')).toBe('1')
    expect(sprintf('%f', '1.5')).toBe('1.5')
    expect(sprintf('%f', true)).toBe('true')
    expect(sprintf('%f', false)).toBe('false')
    expect(sprintf('%f', null)).toBe('null')
    expect(sprintf('%f', undefined)).toBe('undefined')
    expect(sprintf('%f', {})).toBe('[object Object]')
    expect(sprintf('%f', [])).toBe('')
  })
  it('formats objects with %O', () => {
    expect(sprintf('%O', 'foo')).toBe('"foo"')
    expect(sprintf('%O', 1)).toBe('1')
    expect(sprintf('%O', true)).toBe('true')
    expect(sprintf('%O', null)).toBe('null')
    expect(sprintf('%O', undefined)).toBe('undefined')
    expect(sprintf('%O', {})).toBe('{}')
    expect(sprintf('%O', [])).toBe('[]')
    expect(sprintf('%O', { hello: 'world' })).toBe('{hello:"world"}')
  })
  it('formats multiple arguments', () => {
    expect(sprintf('%s %O', 'foo', { hello: 'world' })).toBe(
      'foo {hello:"world"}'
    )
    expect(sprintf('%O %s', { hello: 'world' }, 'foo')).toBe(
      '{hello:"world"} foo'
    )
  })
  it('supports mismatching numbers of arguments and placeholders', () => {
    expect(sprintf('%s %s', 'foo')).toBe('foo undefined')
    expect(sprintf('%s %s', 'foo', 'bar', 'baz')).toBe('foo bar')
  })
})
