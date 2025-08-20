import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  withNuqsTestingAdapter,
  type OnUrlUpdateFunction
} from './adapters/testing'
import { debounce } from './lib/queues/rate-limiting'
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsJson,
  parseAsString
} from './parsers'
import { useQueryState } from './useQueryState'
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
    const useTestHook = (keys: [string, string] = ['a', 'b']) =>
      useQueryStates({
        [keys[0]]: parseAsInteger,
        [keys[1]]: parseAsInteger
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

  it('updating keys also updates the result structure', () => {
    const useTestHook = (keys: string[] = ['a', 'b']) =>
      useQueryStates(
        keys.reduce((acc, key) => ({ ...acc, [key]: parseAsInteger }), {})
      )
    const { result, rerender } = renderHook(useTestHook, {
      wrapper: withNuqsTestingAdapter({
        searchParams: ''
      })
    })
    expect(result.current[0]).toStrictEqual({ a: null, b: null })
    rerender(['a']) // remove b
    expect(result.current[0]).toStrictEqual({ a: null })
    rerender(['a', 'b', 'c']) // add c
    expect(result.current[0]).toStrictEqual({ a: null, b: null, c: null })
    rerender(['a', 'b', 'd']) // remove c, add d
    expect(result.current[0]).toStrictEqual({ a: null, b: null, d: null })
  })

  it('supports dynamic keys with remapping', () => {
    const useTestHook = (keys: [string, string] = ['a', 'b']) =>
      useQueryStates(
        {
          [keys[0]]: parseAsInteger,
          [keys[1]]: parseAsInteger
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

describe('useQueryStates: update sequencing', () => {
  it('should combine updates for a single key made in the same event loop tick', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const { result } = renderHook(
      () => useQueryStates({ test: parseAsString }),
      {
        wrapper: withNuqsTestingAdapter({
          onUrlUpdate
        })
      }
    )
    await act(() => {
      result.current[1]({ test: 'a' })
      return result.current[1]({ test: 'b' })
    })
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].queryString).toEqual('?test=b')
  })

  it('should combine updates for multiple keys in the same hook made in the same event loop tick', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const { result } = renderHook(
      () => useQueryStates({ a: parseAsString, b: parseAsString }),
      {
        wrapper: withNuqsTestingAdapter({
          onUrlUpdate
        })
      }
    )
    await act(() => {
      result.current[1]({ a: 'a' })
      return result.current[1](() => ({ b: 'b' }))
    })
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].queryString).toEqual('?a=a&b=b')
  })

  it('should combine updates for multiple keys in different hook made in the same event loop tick', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const { result } = renderHook(
      () => ({
        a: useQueryStates({ a: parseAsString }),
        b: useQueryStates({ b: parseAsString })
      }),
      {
        wrapper: withNuqsTestingAdapter({
          onUrlUpdate
        })
      }
    )
    await act(() => {
      result.current.a[1]({ a: 'a' })
      return result.current.b[1](() => ({ b: 'b' }))
    })
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].queryString).toEqual('?a=a&b=b')
  })

  it('should return a stable Promise when pushing multiple updates in the same tick', async () => {
    const { result } = renderHook(
      () =>
        useQueryStates({
          a: parseAsString,
          b: parseAsString
        }),
      {
        wrapper: withNuqsTestingAdapter()
      }
    )
    let p1: Promise<URLSearchParams> | undefined = undefined
    let p2: Promise<URLSearchParams> | undefined = undefined
    await act(() => {
      p1 = result.current[1]({ a: 'a' })
      p2 = result.current[1]({ b: 'b' })
      return p2
    })
    expect(p1).toBeInstanceOf(Promise)
    expect(p2).toBeInstanceOf(Promise)
    expect(p1).toBe(p2)
    await expect(p1).resolves.toEqual(new URLSearchParams('?a=a&b=b'))
  })

  it('should return a stable Promise when pushing multiple updates in the same tick (multiple useQueryStates)', async () => {
    const { result } = renderHook(
      () => ({
        foo: useQueryStates({ a: parseAsString }),
        bar: useQueryStates({ b: parseAsString })
      }),
      {
        wrapper: withNuqsTestingAdapter()
      }
    )
    let p1: Promise<URLSearchParams> | undefined = undefined
    let p2: Promise<URLSearchParams> | undefined = undefined
    await act(() => {
      p1 = result.current.foo[1]({ a: 'a' })
      p2 = result.current.bar[1]({ b: 'b' })
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
        foo: useQueryStates({ a: parseAsString }),
        bar: useQueryStates({ b: parseAsString })
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
        p0 = result.current.foo[1]({ a: 'init' })
        // Then two updates before the end of the throttle timeout
        setTimeout(() => { p1 = result.current.foo[1]({a:'a'}) }, 10)
        setTimeout(() => { p2 = result.current.bar[1]({b:'b'}) }, 20)
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

  it('should return the same Promise as useQueryState', async () => {
    const { result } = renderHook(
      () => ({
        foo: useQueryStates({ a: parseAsString }),
        bar: useQueryState('b')
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
        p0 = result.current.foo[1]({ a: 'init' })
        // Then two updates before the end of the throttle timeout
        setTimeout(() => { p1 = result.current.foo[1]({a:'a'}) }, 10)
        setTimeout(() => { p2 = result.current.bar[1]('b') }, 20)
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
        foo: useQueryStates({
          a: parseAsString.withOptions({ limitUrlUpdates: debounce(100) })
        }),
        bar: useQueryStates({
          b: parseAsString
        })
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
      p1 = result.current.foo[1]({ a: 'a' })
      p2 = result.current.bar[1]({ b: 'b' })
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

  it('aborts a debounced update when pushing a throttled one', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const { result } = renderHook(
      () =>
        useQueryStates({
          test: parseAsString
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
      p1 = result.current[1](
        { test: 'init' },
        { limitUrlUpdates: debounce(100) }
      )
      p2 = result.current[1]({ test: 'pass' })
      return Promise.allSettled([p1, p2])
    })
    expect(p1).toBeInstanceOf(Promise)
    expect(p2).toBeInstanceOf(Promise)
    expect(p1).not.toBe(p2)
    // Note: our mock adapter does not save search params, so there is no merge
    await expect(p1).resolves.toEqual(new URLSearchParams('?test=pass'))
    await expect(p2).resolves.toEqual(new URLSearchParams('?test=pass'))
    expect(onUrlUpdate).toHaveBeenCalledTimes(1)
    expect(onUrlUpdate.mock.calls[0]![0].queryString).toEqual('?test=pass')
  })

  it('does not abort when pushing another key', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const { result } = renderHook(
      () =>
        useQueryStates({
          a: parseAsString.withOptions({ limitUrlUpdates: debounce(100) }),
          b: parseAsString
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
      p1 = result.current[1]({ a: 'debounced' })
      p2 = result.current[1]({ b: 'pass' })
      return Promise.allSettled([p1, p2])
    })
    expect(p1).toBeInstanceOf(Promise)
    expect(p2).toBeInstanceOf(Promise)
    expect(p1).not.toBe(p2)
    // Note: our mock adapter does not save search params, so there is no merge
    await expect(p1).resolves.toEqual(new URLSearchParams('?a=debounced'))
    await expect(p2).resolves.toEqual(new URLSearchParams('?b=pass'))
    expect(onUrlUpdate).toHaveBeenCalledTimes(2)
    expect(onUrlUpdate.mock.calls[0]![0].queryString).toEqual('?b=pass')
    expect(onUrlUpdate.mock.calls[1]![0].queryString).toEqual('?a=debounced')
  })
})

describe('useQueryStates: adapter defaults', () => {
  it('should use adapter default value for `shallow` when provided', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const useTestHook = () => useQueryStates({ test: parseAsString })
    const { result } = renderHook(useTestHook, {
      wrapper: withNuqsTestingAdapter({
        defaultOptions: {
          shallow: false
        },
        onUrlUpdate
      })
    })
    await act(() => result.current[1]({ test: 'update' }))
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].options.shallow).toBe(false)
  })
  it('should use adapter default value for `scroll` when provided', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const useTestHook = () => useQueryStates({ test: parseAsString })
    const { result } = renderHook(useTestHook, {
      wrapper: withNuqsTestingAdapter({
        defaultOptions: {
          scroll: true
        },
        onUrlUpdate
      })
    })
    await act(() => result.current[1]({ test: 'update' }))
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].options.scroll).toBe(true)
  })
  it('should use adapter default value for `clearOnDefault` when provided', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const useTestHook = () =>
      useQueryStates({ test: parseAsString.withDefault('pass') })
    const { result } = renderHook(useTestHook, {
      wrapper: withNuqsTestingAdapter({
        defaultOptions: {
          clearOnDefault: false
        },
        onUrlUpdate
      })
    })
    await act(() => result.current[1]({ test: 'pass' }))
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].queryString).toBe('?test=pass')
  })
})
