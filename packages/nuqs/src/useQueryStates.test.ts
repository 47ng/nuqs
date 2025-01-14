import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  withNuqsTestingAdapter,
  type OnUrlUpdateFunction
} from './adapters/testing'
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsJson,
  parseAsString
} from './parsers'
import { useQueryStates } from './useQueryStates'

describe('useQueryStates', () => {
  it('allows setting a single value', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const useTestHook = () =>
      useQueryStates({
        a: parseAsString,
        b: parseAsString
      })
    const { result } = renderHook(useTestHook, {
      wrapper: withNuqsTestingAdapter({
        onUrlUpdate
      })
    })
    expect(result.current[0].a).toBeNull()
    expect(result.current[0].b).toBeNull()
    await act(() => result.current[1]({ a: 'pass' }))
    expect(result.current[0].a).toEqual('pass')
    expect(result.current[0].b).toBeNull()
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].queryString).toEqual('?a=pass')
  })

  it('allows clearing a single key by setting it to null', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const useTestHook = () =>
      useQueryStates({
        a: parseAsString,
        b: parseAsString
      })
    const { result } = renderHook(useTestHook, {
      wrapper: withNuqsTestingAdapter({
        searchParams: '?a=init&b=init',
        onUrlUpdate
      })
    })
    expect(result.current[0].a).toEqual('init')
    expect(result.current[0].b).toEqual('init')
    await act(() => result.current[1]({ a: null }))
    expect(result.current[0].a).toBeNull()
    expect(result.current[0].b).toEqual('init')
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].queryString).toEqual('?b=init')
  })
  it('allows clearing managed keys by passing null', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const useTestHook = () =>
      useQueryStates({
        a: parseAsString,
        b: parseAsString
      })
    const { result } = renderHook(useTestHook, {
      wrapper: withNuqsTestingAdapter({
        searchParams: '?a=init&b=init',
        onUrlUpdate
      })
    })
    await act(() => result.current[1](null))
    expect(result.current[0].a).toBeNull()
    expect(result.current[0].b).toBeNull()
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].queryString).toEqual('')
  })
  it('allows clearing managed keys by passing a function that returns null', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const useTestHook = () =>
      useQueryStates({
        a: parseAsString,
        b: parseAsString
      })
    const { result } = renderHook(useTestHook, {
      wrapper: withNuqsTestingAdapter({
        searchParams: '?a=init&b=init',
        onUrlUpdate
      })
    })
    await act(() => result.current[1](() => null))
    expect(result.current[0].a).toBeNull()
    expect(result.current[0].b).toBeNull()
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].queryString).toEqual('')
  })
})

describe('useQueryStates: referential equality', () => {
  const defaults = {
    str: 'foo',
    obj: { initial: 'state' },
    arr: [
      {
        initial: 'state'
      }
    ]
  }

  const useTestHookWithDefaults = (
    { defaultValue } = { defaultValue: defaults.str }
  ) => {
    return useQueryStates({
      str: parseAsString.withDefault(defaultValue),
      obj: parseAsJson<any>(x => x).withDefault(defaults.obj),
      arr: parseAsArrayOf(parseAsJson<any>(x => x)).withDefault(defaults.arr)
    })
  }

  it('should have referential equality on default values', () => {
    const { result } = renderHook(useTestHookWithDefaults, {
      wrapper: withNuqsTestingAdapter()
    })
    const [state] = result.current
    expect(state.str).toBe(defaults.str)
    expect(state.obj).toBe(defaults.obj)
    expect(state.arr).toBe(defaults.arr)
    expect(state.arr[0]).toBe(defaults.arr[0])
  })

  it('should keep referential equality when resetting to defaults', async () => {
    const { result } = renderHook(useTestHookWithDefaults, {
      wrapper: withNuqsTestingAdapter({
        searchParams: {
          str: 'foo',
          obj: '{"hello":"world"}',
          arr: '{"obj":true},{"arr":true}'
        }
      })
    })
    await act(() => result.current[1](null))
    const [state] = result.current
    expect(state.str).toBe(defaults.str)
    expect(state.obj).toBe(defaults.obj)
    expect(state.arr).toBe(defaults.arr)
    expect(state.arr[0]).toBe(defaults.arr[0])
  })

  it('should keep referential equality when unrelated keys change', async () => {
    const { result } = renderHook(useTestHookWithDefaults, {
      wrapper: withNuqsTestingAdapter({
        searchParams: {
          str: 'foo',
          obj: '{"hello":"world"}'
          // Keep arr as default
        }
      })
    })
    const [{ obj: initialObj, arr: initialArr }] = result.current
    await act(() => result.current[1]({ str: 'bar' }))
    const [{ str, obj, arr }] = result.current
    expect(str).toBe('bar')
    expect(obj).toBe(initialObj)
    expect(arr).toBe(initialArr)
  })

  it('should keep referential equality when default changes for another key', () => {
    const { result, rerender } = renderHook(useTestHookWithDefaults, {
      wrapper: withNuqsTestingAdapter()
    })
    expect(result.current[0].str).toBe('foo')
    rerender({ defaultValue: 'b' })
    const [state] = result.current
    expect(state.str).toBe('b')
    expect(state.obj).toBe(defaults.obj)
    expect(state.arr).toBe(defaults.arr)
    expect(state.arr[0]).toBe(defaults.arr[0])
  })
})

describe('useQueryStates: urlKeys remapping', () => {
  it('uses the object key names by default', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const useTestHook = () =>
      useQueryStates({
        foo: parseAsString,
        bar: parseAsString
      })
    const { result } = renderHook(useTestHook, {
      wrapper: withNuqsTestingAdapter({
        searchParams: '?foo=init&bar=init',
        onUrlUpdate
      })
    })
    expect(result.current[0].foo).toEqual('init')
    expect(result.current[0].bar).toEqual('init')
    await act(() => result.current[1]({ foo: 'a', bar: 'b' }))
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].queryString).toEqual('?foo=a&bar=b')
  })

  it('allows remapping keys partially', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const useTestHook = () =>
      useQueryStates(
        {
          foo: parseAsString,
          bar: parseAsString
        },
        {
          urlKeys: {
            foo: 'f'
          }
        }
      )
    const { result } = renderHook(useTestHook, {
      wrapper: withNuqsTestingAdapter({
        searchParams: '?f=foo&bar=bar',
        onUrlUpdate
      })
    })
    expect(result.current[0].foo).toEqual('foo')
    expect(result.current[0].bar).toEqual('bar')
    await act(() => result.current[1]({ foo: 'a', bar: 'b' }))
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].queryString).toEqual('?f=a&bar=b')
  })
})

describe('useQueryStates: clearOnDefault', () => {
  it('honors clearOnDefault: true by default', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const useTestHook = () =>
      useQueryStates({
        test: parseAsString.withDefault('default')
      })
    const { result } = renderHook(useTestHook, {
      wrapper: withNuqsTestingAdapter({
        searchParams: '?test=init',
        onUrlUpdate
      })
    })
    await act(() => result.current[1]({ test: 'default' }))
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].queryString).toEqual('')
  })

  it('supports clearOnDefault: false (parser level)', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const useTestHook = () =>
      useQueryStates({
        a: parseAsString.withDefault('default').withOptions({
          clearOnDefault: false
        }),
        b: parseAsString.withDefault('default')
      })
    const { result } = renderHook(useTestHook, {
      wrapper: withNuqsTestingAdapter({
        searchParams: '?a=init&b=init',
        onUrlUpdate
      })
    })
    await act(() => result.current[1]({ a: 'default', b: 'default' }))
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].queryString).toEqual('?a=default')
  })

  it('supports clearOnDefault: false (hook level)', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const useTestHook = () =>
      useQueryStates(
        {
          a: parseAsString.withDefault('default'),
          b: parseAsString.withDefault('default').withOptions({
            clearOnDefault: true // overrides hook options
          })
        },
        {
          clearOnDefault: false
        }
      )
    const { result } = renderHook(useTestHook, {
      wrapper: withNuqsTestingAdapter({
        searchParams: '?a=init&b=init',
        onUrlUpdate
      })
    })
    await act(() => result.current[1]({ a: 'default', b: 'default' }))
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].queryString).toEqual('?a=default')
  })

  it('supports clearOnDefault: false (call level)', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const useTestHook = () =>
      useQueryStates(
        {
          a: parseAsString.withDefault('default'),
          b: parseAsString.withDefault('default').withOptions({
            clearOnDefault: true // overrides hook options
          })
        },
        {
          clearOnDefault: false
        }
      )
    const { result } = renderHook(useTestHook, {
      wrapper: withNuqsTestingAdapter({
        searchParams: '?a=init&b=init',
        onUrlUpdate
      })
    })
    await act(() =>
      result.current[1](
        { a: 'default', b: 'default' },
        {
          clearOnDefault: true
        }
      )
    )
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].queryString).toEqual('')
  })
})

describe('useQueryStates: dynamic keys', () => {
  it('supports dynamic keys', () => {
    const useTestHook = (keys: string[] = ['a', 'b']) =>
      useQueryStates({
        [keys[0]!]: parseAsInteger,
        [keys[1]!]: parseAsInteger
      })
    const { result, rerender } = renderHook(useTestHook, {
      wrapper: withNuqsTestingAdapter({
        searchParams: '?a=1&b=2&c=3&d=4'
      })
    })
    expect(result.current[0].a).toEqual(1)
    expect(result.current[0].b).toEqual(2)
    expect(result.current[0].c).toBeUndefined()
    expect(result.current[0].d).toBeUndefined()
    rerender(['c', 'd'])
    expect(result.current[0].a).toBeUndefined()
    expect(result.current[0].b).toBeUndefined()
    expect(result.current[0].c).toEqual(3)
    expect(result.current[0].d).toEqual(4)
  })

  it('supports dynamic keys with remapping', () => {
    const useTestHook = (keys: string[] = ['a', 'b']) =>
      useQueryStates(
        {
          [keys[0]!]: parseAsInteger,
          [keys[1]!]: parseAsInteger
        },
        {
          urlKeys: {
            a: 'x',
            b: 'y',
            c: 'z'
          }
        }
      )
    const { result, rerender } = renderHook(useTestHook, {
      wrapper: withNuqsTestingAdapter({
        searchParams: '?x=1&y=2&z=3'
      })
    })
    expect(result.current[0].a).toEqual(1)
    expect(result.current[0].b).toEqual(2)
    expect(result.current[0].c).toBeUndefined()
    expect(result.current[0].d).toBeUndefined()
    expect(result.current[0].x).toBeUndefined()
    expect(result.current[0].y).toBeUndefined()
    expect(result.current[0].z).toBeUndefined()
    rerender(['c', 'd'])
    expect(result.current[0].a).toBeUndefined()
    expect(result.current[0].b).toBeUndefined()
    expect(result.current[0].c).toEqual(3)
    expect(result.current[0].d).toBeNull()
    expect(result.current[0].x).toBeUndefined()
    expect(result.current[0].y).toBeUndefined()
    expect(result.current[0].z).toBeUndefined()
  })
})
