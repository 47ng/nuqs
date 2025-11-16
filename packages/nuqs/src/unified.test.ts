import { describe, expect, it } from 'vitest'
import { parseAsInteger, parseAsString } from './parsers'
import { defineSearchParams } from './unified'

describe('Unified API', () => {
  it('creates an object containing a loader', () => {
    const out = defineSearchParams({
      foo: parseAsString,
      bar: parseAsInteger
    })
    expect(out.load).toBeInstanceOf(Function)
  })
  it('creates an object containing a serializer', () => {
    const out = defineSearchParams({
      foo: parseAsString,
      bar: parseAsInteger
    })
    expect(out.serialize).toBeInstanceOf(Function)
  })
  it('exposes the parsers it was created with', () => {
    const parsers = {
      foo: parseAsString,
      bar: parseAsInteger
    }
    const out = defineSearchParams(parsers)
    expect(out.parsers).toBe(parsers)
  })
  it('allows extending with additional parsers', () => {
    const base = defineSearchParams({
      foo: parseAsString
    })
    const extended = base.extend({
      bar: parseAsInteger
    })
    expect(extended.parsers).toEqual({
      foo: parseAsString,
      bar: parseAsInteger
    })
  })
  it('allows picking a subset of parsers', () => {
    const base = defineSearchParams({
      foo: parseAsString,
      bar: parseAsInteger
    })
    const picked = base.pick({
      bar: true
    })
    expect(picked.parsers).toEqual({
      bar: parseAsInteger
    })
  })
})
