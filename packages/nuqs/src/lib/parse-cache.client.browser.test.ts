import { afterEach, describe, expect, it, vi } from 'vitest'
import { setDebugSink } from './debug'
import {
  clearParseCacheKey,
  getParseCacheVersion,
  parseWithCache,
  retainParseCache
} from './parse-cache'

type AnyQuery = string & Array<string>

const asQuery = (query: string | string[]) => query as AnyQuery

describe('parseWithCache', () => {
  afterEach(() => setDebugSink(null))
  it('returns a referentially stable value for the same parser and query', () => {
    const parse = (query: string) => ({ value: query })
    const a = parseWithCache('parse-cache-stable', parse, asQuery('foo'))
    const b = parseWithCache('parse-cache-stable', parse, asQuery('foo'))
    expect(a).toEqual({ value: 'foo' })
    expect(b).toBe(a)
  })
  it('re-parses when the query changes', () => {
    const parse = (query: string) => ({ value: query })
    const a = parseWithCache('parse-cache-query', parse, asQuery('foo'))
    const b = parseWithCache('parse-cache-query', parse, asQuery('bar'))
    expect(a).toEqual({ value: 'foo' })
    expect(b).toEqual({ value: 'bar' })
  })
  it('keeps only the latest parser binding for a key', () => {
    const parseA = vi.fn((query: string) => ({ a: query }))
    const parseB = (query: string) => ({ b: query })
    const a = parseWithCache('parse-cache-double-bind', parseA, asQuery('x'))
    const b = parseWithCache('parse-cache-double-bind', parseB, asQuery('x'))
    const a2 = parseWithCache('parse-cache-double-bind', parseA, asQuery('x'))
    expect(a).toEqual({ a: 'x' })
    expect(b).toEqual({ b: 'x' })
    expect(a2).not.toBe(a)
    expect(parseA).toHaveBeenCalledTimes(2)
  })
  it('compares array queries by value', () => {
    const parse = (queries: string[]) => queries.map(query => ({ query }))
    const a = parseWithCache('parse-cache-multi', parse, asQuery(['a', 'b']))
    const b = parseWithCache('parse-cache-multi', parse, asQuery(['a', 'b']))
    const c = parseWithCache('parse-cache-multi', parse, asQuery(['a', 'c']))
    expect(b).toBe(a)
    expect(c).not.toBe(a)
    expect(c).toEqual([{ query: 'a' }, { query: 'c' }])
  })
  it('caches parse failures as null', () => {
    const debugSink = vi.fn()
    setDebugSink(debugSink)
    const parse = vi.fn(() => {
      throw new Error('parse error')
    })
    const a = parseWithCache('parse-cache-failure', parse, asQuery('foo'))
    const b = parseWithCache('parse-cache-failure', parse, asQuery('foo'))
    expect(a).toBeNull()
    expect(b).toBeNull()
    expect(parse).toHaveBeenCalledOnce()
    expect(debugSink).toHaveBeenCalledTimes(2)
    expect(debugSink).toHaveBeenNthCalledWith(
      2,
      25,
      ['foo', expect.any(Error), 'parse-cache-failure'],
      true
    )
  })
  it('does not warn when reusing a successful parse', () => {
    const debugSink = vi.fn()
    setDebugSink(debugSink)
    const parse = (query: string) => query
    parseWithCache('parse-cache-success-warning', parse, asQuery('foo'))
    parseWithCache('parse-cache-success-warning', parse, asQuery('foo'))
    expect(debugSink).not.toHaveBeenCalled()
  })
  it('evicts the oldest entry when the cache is full', () => {
    const parse = vi.fn((query: string) => query)
    parseWithCache('evict-0', parse, asQuery('first'))
    for (let i = 1; i < 1000; i++) {
      parseWithCache(`evict-${i}`, parse, asQuery('x'))
    }
    expect(parse).toHaveBeenCalledTimes(1000)
    // The cache is full: a new key evicts the oldest entry (evict-0)…
    parseWithCache('evict-1000', parse, asQuery('x'))
    parseWithCache('evict-0', parse, asQuery('first'))
    expect(parse).toHaveBeenCalledTimes(1002)
    // …but refreshing an existing key does not evict anything:
    // the oldest remaining entry (evict-2) must still be cached.
    parseWithCache('evict-500', parse, asQuery('refreshed'))
    parseWithCache('evict-2', parse, asQuery('x'))
    expect(parse).toHaveBeenCalledTimes(1003)
  })
  it('contracts after retained keys are released', () => {
    const releases = Array.from({ length: 1001 }, (_, i) => {
      retainParseCache(`retained-${i}`, 1)
      return () => retainParseCache(`retained-${i}`, -1)
    })
    releases.forEach(release => release())
    const parse = vi.fn((query: string) => query)
    parseWithCache('retained-sentinel', parse, asQuery('x'))
    for (let i = 0; i < 1000; i++) {
      parseWithCache(`retained-filler-${i}`, parse, asQuery('x'))
    }
    parseWithCache('retained-sentinel', parse, asQuery('x'))
    expect(parse).toHaveBeenCalledTimes(1002)
  })
  it('re-parses a cleared key and drops its publication version', () => {
    const key = 'parse-cache-cleared'
    const parse = (query: string) => ({ query })
    const published = { query: 'a' }
    parseWithCache(key, parse, asQuery('a'), published)
    expect(getParseCacheVersion(key)).toBeTypeOf('number')
    clearParseCacheKey(key)
    expect(getParseCacheVersion(key)).toBeUndefined()
    expect(parseWithCache(key, parse, asQuery('a'))).not.toBe(published)
  })
  it('ignores a key the cache never saw', () => {
    expect(() => clearParseCacheKey('parse-cache-unknown')).not.toThrow()
  })
})
