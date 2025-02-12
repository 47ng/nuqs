import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  withNuqsTestingAdapter,
  type OnUrlUpdateFunction
} from './adapters/testing'
import { debounce } from './lib/queues/rate-limiting'
import { parseAsArrayOf, parseAsJson, parseAsString } from './parsers'
import { useQueryState } from './useQueryState'

describe('useQueryState: referential equality', () => {
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
    const str = useQueryState('str', parseAsString.withDefault(defaultValue))
    const obj = useQueryState(
      'obj',
      parseAsJson<any>(x => x).withDefault(defaults.obj)
    )
    const arr = useQueryState(
      'arr',
      parseAsArrayOf(parseAsJson<any>(x => x)).withDefault(defaults.arr)
    )
    return { str, obj, arr }
  }

  it('should have referential equality on default values', () => {
    const { result } = renderHook(useTestHookWithDefaults, {
      wrapper: withNuqsTestingAdapter()
    })
    const { str, obj, arr } = result.current
    expect(str[0]).toBe(defaults.str)
    expect(obj[0]).toBe(defaults.obj)
    expect(arr[0]).toBe(defaults.arr)
    expect(arr[0][0]).toBe(defaults.arr[0])
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
    await act(() => {
      const { str, arr, obj } = result.current
      str[1](null)
      obj[1](null)
      return arr[1](null)
    })
    const { str, arr, obj } = result.current
    expect(str[0]).toBe(defaults.str)
    expect(obj[0]).toBe(defaults.obj)
    expect(arr[0]).toBe(defaults.arr)
    expect(arr[0][0]).toBe(defaults.arr[0])
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
    const initialObj = result.current.obj[0]
    const initialArr = result.current.arr[0]
    await act(() => {
      const { str } = result.current
      return str[1]('bar')
    })
    const { str, obj, arr } = result.current
    expect(str[0]).toBe('bar')
    expect(obj[0]).toBe(initialObj)
    expect(arr[0]).toBe(initialArr)
  })

  it('should keep referential equality when default changes for another key', () => {
    const { result, rerender } = renderHook(useTestHookWithDefaults, {
      wrapper: withNuqsTestingAdapter()
    })
    expect(result.current.str[0]).toBe('foo')
    rerender({ defaultValue: 'b' })
    const { str, obj, arr } = result.current
    expect(str[0]).toBe('b')
    expect(obj[0]).toBe(defaults.obj)
    expect(arr[0]).toBe(defaults.arr)
    expect(arr[0][0]).toBe(defaults.arr[0])
  })
})

describe('useQueryState: clearOnDefault', () => {
  it('honors clearOnDefault: true by default', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const { result } = renderHook(
      () => useQueryState('test', parseAsString.withDefault('default')),
      {
        wrapper: withNuqsTestingAdapter({
          searchParams: '?test=init',
          onUrlUpdate
        })
      }
    )
    await act(() => result.current[1]('default'))
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].queryString).toEqual('')
  })

  it('supports clearOnDefault: false (hook level)', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const useTestHook = () =>
      useQueryState(
        'a',
        parseAsString.withDefault('default').withOptions({
          clearOnDefault: false
        })
      )
    const { result } = renderHook(useTestHook, {
      wrapper: withNuqsTestingAdapter({
        searchParams: '?a=init',
        onUrlUpdate
      })
    })
    await act(() => result.current[1]('default'))
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].queryString).toEqual('?a=default')
  })

  it('supports clearOnDefault: false (call level)', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const useTestHook = () =>
      useQueryState(
        'a',
        parseAsString.withDefault('default').withOptions({
          clearOnDefault: true
        })
      )
    const { result } = renderHook(useTestHook, {
      wrapper: withNuqsTestingAdapter({
        searchParams: '?a=init',
        onUrlUpdate
      })
    })
    await act(() => result.current[1]('default', { clearOnDefault: false }))
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].queryString).toEqual('?a=default')
  })
})

describe('useQueryState: update sequencing', () => {
  it('should combine updates for a single key made in the same event loop tick', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const { result } = renderHook(() => useQueryState('test'), {
      wrapper: withNuqsTestingAdapter({
        onUrlUpdate
      })
    })
    await act(() => {
      result.current[1]('a')
      return result.current[1]('b')
    })
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].queryString).toEqual('?test=b')
  })
  it('should combine updtes for multiple keys made in the same event loop tick', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const { result } = renderHook(
      () => ({
        a: useQueryState('a', parseAsString),
        b: useQueryState('b', parseAsString)
      }),
      {
        wrapper: withNuqsTestingAdapter({
          onUrlUpdate
        })
      }
    )
    await act(() => {
      result.current.a[1]('a')
      return result.current.b[1]('b')
    })
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].queryString).toEqual('?a=a&b=b')
  })
  it('should return a stable Promise when pushing multiple updates in the same tick', async () => {
    const { result } = renderHook(() => useQueryState('test'), {
      wrapper: withNuqsTestingAdapter()
    })
    let p1: Promise<URLSearchParams> | undefined = undefined
    let p2: Promise<URLSearchParams> | undefined = undefined
    await act(() => {
      p1 = result.current[1]('a')
      p2 = result.current[1]('b')
      return p2
    })
    expect(p1).toBeInstanceOf(Promise)
    expect(p2).toBeInstanceOf(Promise)
    expect(p1).toBe(p2)
    await expect(p1).resolves.toEqual(new URLSearchParams('?test=b'))
  })
  it('should return a stable Promise when pushing multiple updates in the same tick (multiple keys)', async () => {
    const { result } = renderHook(
      () => ({
        a: useQueryState('a', parseAsString),
        b: useQueryState('b', parseAsString)
      }),
      {
        wrapper: withNuqsTestingAdapter()
      }
    )
    let p1: Promise<URLSearchParams> | undefined = undefined
    let p2: Promise<URLSearchParams> | undefined = undefined
    await act(() => {
      p1 = result.current.a[1]('a')
      p2 = result.current.b[1]('b')
      return p2
    })
    expect(p1).toBeInstanceOf(Promise)
    expect(p2).toBeInstanceOf(Promise)
    expect(p1).toBe(p2)
    await expect(p1).resolves.toEqual(new URLSearchParams('?a=a&b=b'))
  })
  it('should return a stable Promise when pushing updates before the throttle period times out', async () => {
    const { result } = renderHook(
      () => ({
        a: useQueryState('a', parseAsString),
        b: useQueryState('b', parseAsString)
      }),
      {
        wrapper: withNuqsTestingAdapter({
          rateLimitFactor: 1
        })
      }
    )
    let p0: Promise<URLSearchParams> | undefined = undefined
    let p1: Promise<URLSearchParams> | undefined = undefined
    let p2: Promise<URLSearchParams> | undefined = undefined
    // prettier-ignore
    await act(async () => {
      // Flush the queue from previous tests
      await new Promise(r => setTimeout(r, 60))
      // First, push an update to a to be emitted "immediately"
      p0 = result.current.a[1]('init')
      // Then two updates before the end of the throttle timeout
      setTimeout(() => { p1 = result.current.a[1]('a') }, 10)
      setTimeout(() => { p2 = result.current.b[1]('b') }, 20)
      return new Promise((resolve) => setTimeout(resolve, 30))
    })
    expect(p0).toBeInstanceOf(Promise)
    expect(p1).toBeInstanceOf(Promise)
    expect(p2).toBeInstanceOf(Promise)
    expect(p0).not.toBe(p1)
    expect(p1).toBe(p2)
    await expect(p0).resolves.toEqual(new URLSearchParams('?a=init'))
    await expect(p1).resolves.toEqual(new URLSearchParams('?a=a&b=b'))
  })
  it('should return a new Promise when using debounce', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const { result } = renderHook(
      () => ({
        a: useQueryState('a', { limitUrlUpdates: debounce(100) }),
        b: useQueryState('b')
      }),
      {
        wrapper: withNuqsTestingAdapter({
          onUrlUpdate,
          rateLimitFactor: 1
        })
      }
    )
    let p1: Promise<URLSearchParams> | undefined = undefined
    let p2: Promise<URLSearchParams> | undefined = undefined
    await act(async () => {
      p1 = result.current.a[1]('a')
      p2 = result.current.b[1]('b')
      return p1 // p1 will resolve last, so await it before moving on
    })
    expect(p1).toBeInstanceOf(Promise)
    expect(p2).toBeInstanceOf(Promise)
    expect(p1).not.toBe(p2)
    // Note: our mock adapter does not save search params, so there is no merge
    await expect(p1).resolves.toEqual(new URLSearchParams('?a=a'))
    await expect(p2).resolves.toEqual(new URLSearchParams('?b=b'))
    expect(onUrlUpdate).toHaveBeenCalledTimes(2)
    // b updates first, then a
    expect(onUrlUpdate.mock.calls[0]![0].queryString).toEqual('?b=b')
    expect(onUrlUpdate.mock.calls[1]![0].queryString).toEqual('?a=a')
  })
})
