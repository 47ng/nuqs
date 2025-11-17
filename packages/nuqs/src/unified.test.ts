import { describe, expect, expectTypeOf, it } from 'vitest'
import type { Options } from './defs'
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
  it('supports options', () => {
    const options: Options = {
      shallow: false,
      history: 'push',
      scroll: true,
      limitUrlUpdates: { method: 'throttle', timeMs: 100 },
      clearOnDefault: false
    }
    const out = defineSearchParams(
      {
        a: parseAsString,
        b: parseAsInteger
      },
      options
    )
    expect(out.options).toBe(options)
  })
  it('supports urlKeys as options', () => {
    const out = defineSearchParams(
      {
        search: parseAsString
      },
      {
        urlKeys: {
          search: 'q'
        }
      }
    )
    expect(out.load('?q=testing')).toEqual({ search: 'testing' })
  })
  it('forwards options to the serializer', () => {
    const out = defineSearchParams(
      {
        count: parseAsInteger.withDefault(0)
      },
      {
        clearOnDefault: false,
        urlKeys: {
          count: 'c'
        }
      }
    )
    const received = out.serialize({ count: 0 })
    expect(received).toBe('?c=0')
  })
  it('forwards options to the Standard Schema validator', async () => {
    const out = defineSearchParams(
      {
        a: parseAsString.withDefault('present'),
        b: parseAsString.withDefault('absent')
      },
      {
        partialOutput: true
      }
    )
    out.options
    const result = await out['~standard'].validate({
      a: 'specified',
      // b is missing
      extra: 'remove me'
    })
    if (result.issues) {
      throw new Error('Making TypeScript happy')
    }
    expect(result.value).toEqual({ a: 'specified' })
  })
  it.todo('forwards options to useQueryStates')

  it('extends with a set of parsers', () => {
    const base = defineSearchParams({
      a: parseAsString
    })
    const extended = base.extend({
      b: parseAsInteger
    })
    expect(extended.load('?a=test&b=123')).toEqual({
      a: 'test',
      b: 123
    })
  })
  it('extends with another unified API', () => {
    const a = defineSearchParams({ a: parseAsString })
    const b = defineSearchParams({ b: parseAsInteger })
    const extended = a.extend(b)
    expect(a.load('?a=test&b=123')).toEqual({ a: 'test' })
    expect(b.load('?a=test&b=123')).toEqual({ b: 123 })
    expect(extended.load('?a=test&b=123')).toEqual({
      a: 'test',
      b: 123
    })
  })
  it('combines options when extending with a set of parsers', () => {
    const base = defineSearchParams({ a: parseAsString }, { shallow: false })
    const extended = base.extend({ b: parseAsInteger }, { shallow: true })
    expect(extended.options.shallow).toBe(false) // shallow: false takes precedence
  })
  it('combines options when extending with a unified API', () => {
    const a = defineSearchParams({ a: parseAsString }, { shallow: false })
    const b = defineSearchParams({ b: parseAsInteger }, { shallow: true })
    const extended = a.extend(b)
    expect(extended.options.shallow).toBe(false) // shallow: false takes precedence
  })
})
