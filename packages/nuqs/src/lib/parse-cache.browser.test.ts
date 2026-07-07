import { describe, expect, it, vi } from 'vitest'
import { parseWithCache } from './parse-cache'

type AnyQuery = string & Array<string>

const asQuery = (query: string | string[]) => query as AnyQuery

describe('parseWithCache', () => {
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
  it('misses gracefully when another parser is bound to the same key', () => {
    const parseA = (query: string) => ({ a: query })
    const parseB = (query: string) => ({ b: query })
    const a = parseWithCache('parse-cache-double-bind', parseA, asQuery('x'))
    const b = parseWithCache('parse-cache-double-bind', parseB, asQuery('x'))
    expect(a).toEqual({ a: 'x' })
    expect(b).toEqual({ b: 'x' })
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
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {})
    const parse = vi.fn(() => {
      throw new Error('parse error')
    })
    const a = parseWithCache('parse-cache-failure', parse, asQuery('foo'))
    const b = parseWithCache('parse-cache-failure', parse, asQuery('foo'))
    expect(a).toBeNull()
    expect(b).toBeNull()
    expect(parse).toHaveBeenCalledOnce()
    consoleWarnSpy.mockRestore()
  })
})
