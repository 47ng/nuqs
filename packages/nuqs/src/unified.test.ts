import { describe, expect, expectTypeOf, it } from 'vitest'
import { parseAsInteger, parseAsString, type inferParserType } from './parsers'
import { defineSearchParams } from './unified'

describe('Unified API', () => {
  it('creates an object containing a loader', () => {
    const out = defineSearchParams({
      a: parseAsString,
      b: parseAsInteger
    })
    expect(out.load('?a=pass&b=123')).toEqual({ a: 'pass', b: 123 })
  })
  it('creates an object containing a serializer', () => {
    const out = defineSearchParams({
      a: parseAsString,
      b: parseAsInteger
    })
    expect(out.serialize({ a: 'pass', b: 123 })).toBe('?a=pass&b=123')
  })
  it('exposes the parsers it was created with', () => {
    const parsers = {
      a: parseAsString,
      b: parseAsInteger
    }
    const out = defineSearchParams(parsers)
    expect(out.parsers).toBe(parsers)
  })
  it('allows extending with additional parsers', () => {
    const base = defineSearchParams({
      a: parseAsString
    })
    const extended = base.extend({
      b: parseAsInteger
    })
    expect(extended.parsers).toEqual({
      a: parseAsString,
      b: parseAsInteger
    })
  })
  it('allows picking a subset of parsers', () => {
    const base = defineSearchParams({
      a: parseAsString,
      b: parseAsInteger
    })
    const picked = base.pick({
      b: true
    })
    expect(picked.parsers).toEqual({
      b: parseAsInteger
    })
  })
  it('conforms to StandardSchemaV1', async () => {
    const out = defineSearchParams({
      a: parseAsString,
      b: parseAsInteger
    })
    const result = await out['~standard'].validate({ a: 'test', b: 456 })
    expect(result.issues).toBeUndefined()
    if (result.issues) {
      throw new Error('Making TypeScript happy')
    }
    expect(result.value).toEqual({
      a: 'test',
      b: 456
    })
  })
  it('can infer the parsers type directly via inferParserType', () => {
    const out = defineSearchParams({
      a: parseAsString,
      b: parseAsInteger
    })
    type Inferred = inferParserType<typeof out>
    expectTypeOf<Inferred>().toEqualTypeOf<{
      a: string | null
      b: number | null
    }>()
  })
})
