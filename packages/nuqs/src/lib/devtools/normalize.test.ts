import { describe, expect, it } from 'vitest'
import { normalize } from './normalize'

describe('devtools/normalize', () => {
  it('passes primitives through', () => {
    expect(normalize(1)).toBe(1)
    expect(normalize('x')).toBe('x')
    expect(normalize(true)).toBe(true)
    expect(normalize(null)).toBe(null)
    expect(normalize(undefined)).toBe(undefined)
  })

  it('replaces functions with a presence marker', () => {
    expect(normalize(() => {})).toBe('[Function]')
    const out = normalize({ startTransition: () => {}, history: 'push' })
    expect(out).toEqual({ startTransition: '[Function]', history: 'push' })
  })

  it('clones URLSearchParams, preserving type and entries', () => {
    const sp = new URLSearchParams('a=1&b=2')
    const out = normalize(sp)
    expect(out).toBeInstanceOf(URLSearchParams)
    expect(out).not.toBe(sp)
    expect((out as URLSearchParams).toString()).toBe('a=1&b=2')
  })

  it('clones URL, preserving href', () => {
    const url = new URL('https://example.com/p?q=1')
    const out = normalize(url)
    expect(out).toBeInstanceOf(URL)
    expect(out).not.toBe(url)
    expect((out as URL).href).toBe(url.href)
  })

  it('keeps the Error reference so instanceof holds', () => {
    const err = new Error('boom')
    expect(normalize(err)).toBe(err)
  })

  it('clones Date, Map and Set', () => {
    const date = new Date(0)
    expect(normalize(date)).toBeInstanceOf(Date)
    expect(normalize(date)).not.toBe(date)
    expect(normalize(new Map([['k', 1]]))).toEqual(new Map([['k', 1]]))
    expect(normalize(new Set([1, 2]))).toEqual(new Set([1, 2]))
  })

  it('snapshots against later in-place mutation', () => {
    const sp = new URLSearchParams('count=1')
    const out = normalize(sp) as URLSearchParams
    sp.set('count', '2')
    expect(out.get('count')).toBe('1')
  })

  it('guards reference cycles', () => {
    const obj: Record<string, unknown> = { a: 1 }
    obj.self = obj
    const out = normalize(obj) as Record<string, unknown>
    expect(out.a).toBe(1)
    expect(out.self).toBe(out)
  })

  it('reduces class instances to plain data, dropping methods', () => {
    class Point {
      x = 1
      y = 2
      distance() {
        return Math.hypot(this.x, this.y)
      }
    }
    expect(normalize(new Point())).toEqual({ x: 1, y: 2 })
  })
})
