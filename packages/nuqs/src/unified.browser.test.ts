import { describe, expect, expectTypeOf, it, vi } from 'vitest'
import { renderHook } from 'vitest-browser-react'
import {
  withNuqsTestingAdapter,
  type OnUrlUpdateFunction
} from './adapters/testing'
import type { Options } from './defs'
import { parseAsInteger, parseAsString, type inferParserType } from './parsers'
import { defineSearchParams } from './unified'
import { useQueryStates } from './useQueryStates'

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
  it('forwards options to useQueryStates', async () => {
    const out = defineSearchParams(
      {
        a: parseAsString.withOptions({ history: 'push' }),
        b: parseAsInteger.withOptions({ shallow: false })
      },
      {
        scroll: true
      }
    )
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const { act, result } = await renderHook(() => useQueryStates(out), {
      wrapper: withNuqsTestingAdapter({
        onUrlUpdate
      })
    })
    await act(() => result.current[1]({ a: 'updated', b: 100 }))
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].options).toEqual({
      history: 'push',
      shallow: false,
      scroll: true
    })
  })
  it('lets useQueryStates options override unified options', async () => {
    const out = defineSearchParams(
      {
        a: parseAsString.withOptions({ history: 'push' }),
        b: parseAsInteger.withOptions({ shallow: false })
      },
      {
        scroll: true
      }
    )
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const { act, result } = await renderHook(() => useQueryStates(out), {
      wrapper: withNuqsTestingAdapter({
        onUrlUpdate
      })
    })
    await act(() =>
      result.current[1](
        { a: 'updated', b: 100 },
        {
          history: 'replace',
          shallow: true,
          scroll: false
        }
      )
    )
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].options).toEqual({
      history: 'replace',
      shallow: true,
      scroll: false
    })
  })

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
    const a = defineSearchParams(
      { a: parseAsString },
      { shallow: false, history: 'replace' }
    )
    const b = defineSearchParams(
      { b: parseAsInteger },
      { shallow: true, history: 'push', urlKeys: { b: 'B' } }
    )
    const extended = a.extend(b, {
      scroll: true,
      urlKeys: {
        b: 'bee'
      }
    })
    expect(extended.options.shallow).toBe(false) // shallow: false takes precedence
    expect(extended.options.history).toBe('push') // history: 'push' takes precedence
    expect(extended.options.scroll).toBe(true) // Passed as extend option
  })

  it('works with useQueryStates', async () => {
    const out = defineSearchParams(
      {
        a: parseAsString.withOptions({ history: 'push' }),
        b: parseAsInteger.withOptions({ shallow: false })
      },
      {
        scroll: true,
        urlKeys: {
          a: 'overridden',
          b: '2'
        }
      }
    )
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const { result, act } = await renderHook(
      () =>
        useQueryStates(out, {
          urlKeys: {
            a: '1'
          }
        }),
      {
        wrapper: withNuqsTestingAdapter({
          searchParams: '?1=hello&2=42',
          onUrlUpdate
        })
      }
    )
    expect(result.current[0]).toEqual({ a: 'hello', b: 42 })
    await act(() => result.current[1]({ a: 'updated', b: 100 }))
    expect(result.current[0]).toEqual({ a: 'updated', b: 100 })
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].queryString).toBe('?1=updated&2=100')
    expect(onUrlUpdate.mock.calls[0]![0].options).toEqual({
      history: 'push',
      shallow: false,
      scroll: true
    })
  })

  it('can infer types', () => {
    const out = defineSearchParams({
      name: parseAsString.withDefault(''),
      age: parseAsInteger
    })
    type Inferred = typeof out.$infer
    expectTypeOf<Inferred>().toEqualTypeOf<{
      name: string
      age: number | null
    }>()
  })
})
