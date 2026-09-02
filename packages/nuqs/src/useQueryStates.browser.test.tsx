import React, {
  createElement,
  startTransition,
  Suspense,
  useEffect,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
  type ReactNode
} from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, renderHook } from 'vitest-browser-react'
import { page, userEvent } from 'vitest/browser'
import { createReactRouterBasedAdapter } from './adapters/lib/react-router'
import {
  NullDetector,
  useFakeLoadingState
} from '../tests/components/repro-1099'
import {
  NuqsTestingAdapter,
  withNuqsTestingAdapter,
  type OnUrlUpdateFunction
} from './adapters/testing'
import { debounce, throttle } from './lib/queues/rate-limiting'
import { resetQueues } from './lib/queues/reset'
import { globalThrottleQueue } from './lib/queues/throttle'
import {
  createParser,
  parseAsArrayOf,
  parseAsInteger,
  parseAsIsoDateTime,
  parseAsJson,
  parseAsNativeArrayOf,
  parseAsString
} from './parsers'
import { useQueryState } from './useQueryState'
import { useQueryStates } from './useQueryStates'

const waitForNextTick = () =>
  new Promise<void>(resolve => {
    setTimeout(resolve, 0)
  })

describe('useQueryStates', () => {
  it.each(['constructor', 'hasOwnProperty'])(
    'supports a scalar query key named %s',
    async key => {
      const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
      const { result, act } = await renderHook(
        () => useQueryState(key, parseAsString),
        {
          wrapper: withNuqsTestingAdapter({
            searchParams: `?${key}=acme`,
            onUrlUpdate
          })
        }
      )

      expect(result.current[0]).toBe('acme')
      await act(() => result.current[1]('ajax'))
      expect(onUrlUpdate.mock.calls[0]![0].queryString).toBe(`?${key}=ajax`)
    }
  )
  it.each(['constructor', 'hasOwnProperty'])(
    'supports a native array query key named %s',
    async key => {
      const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
      const { result, act } = await renderHook(
        () => useQueryState(key, parseAsNativeArrayOf(parseAsString)),
        {
          wrapper: withNuqsTestingAdapter({
            searchParams: `?${key}=acme`,
            onUrlUpdate
          })
        }
      )

      expect(result.current[0]).toEqual(['acme'])
      await act(() => result.current[1](['ajax']))
      expect(onUrlUpdate.mock.calls[0]![0].queryString).toBe(`?${key}=ajax`)
    }
  )
  it.each([
    {
      name: 'comma-containing values to repeated values',
      from: '?a=a%2Cb',
      to: '?a=a&a=b',
      initial: '{"a":["a,b"],"b":[]}',
      expected: '{"a":["a","b"],"b":[]}'
    },
    {
      name: 'repeated values to comma-containing values',
      from: '?a=a&a=b',
      to: '?a=a%2Cb',
      initial: '{"a":["a","b"],"b":[]}',
      expected: '{"a":["a,b"],"b":[]}'
    },
    {
      name: 'an empty value to an absent key',
      from: '?a=',
      to: '',
      initial: '{"a":[""],"b":[]}',
      expected: '{"a":[],"b":[]}'
    },
    {
      name: 'a trailing comma to a repeated empty value',
      from: '?a=a%2C',
      to: '?a=a&a=',
      initial: '{"a":["a,"],"b":[]}',
      expected: '{"a":["a",""],"b":[]}'
    },
    {
      name: 'encoded separators to values split across keys',
      from: '?a=1%26b%3D2',
      to: '?a=1&b=2%26b%3D',
      initial: '{"a":["1&b=2"],"b":[]}',
      expected: '{"a":["1"],"b":["2&b="]}'
    }
  ])('distinguishes $name', async ({ from, to, initial, expected }) => {
    function Child() {
      const [state] = useQueryStates({
        a: parseAsNativeArrayOf(parseAsString),
        b: parseAsNativeArrayOf(parseAsString)
      })
      return <div data-testid="value">{JSON.stringify(state)}</div>
    }
    function TestComponent() {
      const [searchParams, setSearchParams] = useState(from)
      return (
        <>
          <button onClick={() => setSearchParams(to)}>Navigate</button>
          <NuqsTestingAdapter searchParams={searchParams} hasMemory>
            <Child />
          </NuqsTestingAdapter>
        </>
      )
    }

    const user = userEvent.setup()
    render(<TestComponent />)
    await expect.element(page.getByTestId('value')).toHaveTextContent(initial)

    await user.click(page.getByRole('button', { name: 'Navigate' }))

    await expect.element(page.getByTestId('value')).toHaveTextContent(expected)
  })

  it('distinguishes comma-containing and repeated values for a single parser', async () => {
    function Child() {
      const [value] = useQueryState('q')
      return <div data-testid="value">{JSON.stringify(value)}</div>
    }
    function TestComponent() {
      const [searchParams, setSearchParams] = useState('?q=a%2Cb')
      return (
        <>
          <button onClick={() => setSearchParams('?q=a&q=b')}>Navigate</button>
          <NuqsTestingAdapter searchParams={searchParams} hasMemory>
            <Child />
          </NuqsTestingAdapter>
        </>
      )
    }

    const user = userEvent.setup()
    render(<TestComponent />)
    await expect.element(page.getByTestId('value')).toHaveTextContent('"a,b"')

    await user.click(page.getByRole('button', { name: 'Navigate' }))

    await expect.element(page.getByTestId('value')).toHaveTextContent('"a"')
  })

  it('allows setting a single value', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const useTestHook = () =>
      useQueryStates({
        a: parseAsString,
        b: parseAsString
      })
    const { result, act } = await renderHook(useTestHook, {
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
    const { result, act } = await renderHook(useTestHook, {
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
    const { result, act } = await renderHook(useTestHook, {
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
    const { result, act } = await renderHook(useTestHook, {
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
  it('accepts undefined for keys to leave them unchanged', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const useTestHook = () =>
      useQueryStates({
        a: parseAsString,
        b: parseAsString
      })
    const { result, act } = await renderHook(useTestHook, {
      wrapper: withNuqsTestingAdapter({
        searchParams: '?a=init&b=init',
        onUrlUpdate
      })
    })
    expect(result.current[0].a).toEqual('init')
    expect(result.current[0].b).toEqual('init')
    await act(() => result.current[1]({ a: undefined, b: 'changed' }))
    expect(result.current[0].a).toEqual('init')
    expect(result.current[0].b).toEqual('changed')
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].queryString).toEqual(
      '?a=init&b=changed'
    )
  })
  it('accepts undefined for keys to leave them unchanged (updater function version)', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const useTestHook = () =>
      useQueryStates({
        a: parseAsString,
        b: parseAsString
      })
    const { result, act } = await renderHook(useTestHook, {
      wrapper: withNuqsTestingAdapter({
        searchParams: '?a=init&b=init',
        onUrlUpdate
      })
    })
    expect(result.current[0].a).toEqual('init')
    expect(result.current[0].b).toEqual('init')
    await act(() => result.current[1](() => ({ a: undefined, b: 'changed' })))
    expect(result.current[0].a).toEqual('init')
    expect(result.current[0].b).toEqual('changed')
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].queryString).toEqual(
      '?a=init&b=changed'
    )
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
    ],
    multi: [
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
      arr: parseAsArrayOf(parseAsJson<any>(x => x)).withDefault(defaults.arr),
      multi: parseAsNativeArrayOf(parseAsJson<any>(x => x)).withDefault(
        defaults.multi
      )
    })
  }

  it('adopts a newly defined default even when parser equality returns true', async () => {
    const parser = createParser({
      parse: value => value,
      serialize: value => value,
      eq: () => true
    })
    const useTestHook = (
      { withDefault }: { withDefault: boolean } = { withDefault: false }
    ) =>
      useQueryStates({
        value: withDefault ? parser.withDefault('default') : parser
      })
    const { result, rerender } = await renderHook(useTestHook, {
      initialProps: { withDefault: false },
      wrapper: withNuqsTestingAdapter()
    })

    expect(result.current[0].value).toBeNull()
    await rerender({ withDefault: true })
    expect(result.current[0].value).toBe('default')
  })

  it('should have referential equality on default values', async () => {
    const { result } = await renderHook(useTestHookWithDefaults, {
      wrapper: withNuqsTestingAdapter()
    })
    const [state] = result.current
    expect(state.str).toBe(defaults.str)
    expect(state.obj).toBe(defaults.obj)
    expect(state.arr).toBe(defaults.arr)
    expect(state.arr[0]).toBe(defaults.arr[0])
    expect(state.multi[0]).toBe(defaults.multi[0])
  })

  it('should keep referential equality when resetting to defaults', async () => {
    const { result, act } = await renderHook(useTestHookWithDefaults, {
      wrapper: withNuqsTestingAdapter({
        searchParams: {
          str: 'foo',
          obj: '{"hello":"world"}',
          arr: '{"obj":true},{"arr":true}',
          multi: '{"obj":true},{"arr":true}'
        }
      })
    })
    await act(() => result.current[1](null))
    const [state] = result.current
    expect(state.str).toBe(defaults.str)
    expect(state.obj).toBe(defaults.obj)
    expect(state.arr).toBe(defaults.arr)
    expect(state.arr[0]).toBe(defaults.arr[0])
    expect(state.multi).toBe(defaults.multi)
    expect(state.multi[0]).toBe(defaults.multi[0])
  })

  it('should keep referential equality when unrelated keys change', async () => {
    const { result, act } = await renderHook(useTestHookWithDefaults, {
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

  it('should keep referential equality when default changes for another key', async () => {
    const { result, rerender } = await renderHook(useTestHookWithDefaults, {
      wrapper: withNuqsTestingAdapter()
    })
    expect(result.current[0].str).toBe('foo')
    await rerender({ defaultValue: 'b' })
    const [state] = result.current
    expect(state.str).toBe('b')
    expect(state.obj).toBe(defaults.obj)
    expect(state.arr).toBe(defaults.arr)
    expect(state.arr[0]).toBe(defaults.arr[0])
    expect(state.multi).toBe(defaults.multi)
    expect(state.multi[0]).toBe(defaults.multi[0])
  })

  it('should update when an object default changes', async () => {
    const initialDefault = { value: 'initial' }
    const nextDefault = { value: 'next' }
    const useTestHook = (
      {
        defaultValue
      }: {
        defaultValue: typeof initialDefault
      } = { defaultValue: initialDefault }
    ) =>
      useQueryStates({
        obj: parseAsJson<typeof initialDefault>(
          x => x as typeof initialDefault
        ).withDefault(defaultValue)
      })
    const { result, rerender } = await renderHook(useTestHook, {
      initialProps: { defaultValue: initialDefault },
      wrapper: withNuqsTestingAdapter()
    })

    expect(result.current[0].obj).toBe(initialDefault)
    await rerender({ defaultValue: nextDefault })

    expect(result.current[0].obj).toBe(nextDefault)
  })

  it('keeps inline structured defaults stable until they change', async () => {
    const objectParser = parseAsJson<{ value: string }>(
      value => value as { value: string }
    )
    const arrayParser = parseAsArrayOf(objectParser)
    const useTestHook = ({ value }: { value: string } = { value: 'initial' }) =>
      useQueryStates({
        obj: objectParser.withDefault({ value }),
        arr: arrayParser.withDefault([{ value }])
      })
    const { result, rerender } = await renderHook(useTestHook, {
      initialProps: { value: 'initial' },
      wrapper: withNuqsTestingAdapter()
    })
    const [initialState] = result.current

    await rerender({ value: 'initial' })
    const [equalState] = result.current

    expect(equalState).toBe(initialState)
    expect(equalState.obj).toBe(initialState.obj)
    expect(equalState.arr).toBe(initialState.arr)
    expect(equalState.arr[0]).toBe(initialState.arr[0])

    await rerender({ value: 'next' })
    const [nextState] = result.current

    expect(nextState).not.toBe(initialState)
    expect(nextState.obj).not.toBe(initialState.obj)
    expect(nextState.arr).not.toBe(initialState.arr)
    expect(nextState.arr[0]).not.toBe(initialState.arr[0])
  })

  it('does not have referential stability for structured defaults passed inline without an eq function', async () => {
    const parser = createParser({
      parse: (value: string) => JSON.parse(value) as { value: string },
      serialize: JSON.stringify
      // no eq function provided
    })
    const useTestHook = () =>
      useQueryStates({
        // inline default object
        obj: parser.withDefault({ value: 'default' })
      })
    const { result, rerender } = await renderHook(useTestHook, {
      wrapper: withNuqsTestingAdapter()
    })
    const [initialState] = result.current

    await rerender()

    expect(result.current[0]).not.toBe(initialState)
    expect(result.current[0].obj).not.toBe(initialState.obj)
  })

  it('supports defaults that cannot be JSON serialized', async () => {
    const parser = createParser({
      parse: BigInt,
      serialize: String
    }).withDefault(0n)
    const useTestHook = () => useQueryStates({ value: parser })

    const { result, rerender } = await renderHook(useTestHook, {
      wrapper: withNuqsTestingAdapter()
    })

    expect(result.current[0].value).toBe(0n)
    await rerender()
    expect(result.current[0].value).toBe(0n)
  })

  it('should use the latest default when another hook clears the value', async () => {
    const useTestHook = (
      { defaultValue }: { defaultValue: string } = {
        defaultValue: 'initial'
      }
    ) => ({
      withDefault: useQueryStates({
        test: parseAsString.withDefault(defaultValue)
      }),
      withoutDefault: useQueryState('test', parseAsString)
    })
    const { result, rerender, act } = await renderHook(useTestHook, {
      initialProps: { defaultValue: 'initial' },
      wrapper: withNuqsTestingAdapter()
    })

    await rerender({ defaultValue: 'next' })
    await act(() => result.current.withoutDefault[1]('value'))
    expect(result.current.withDefault[0].test).toBe('value')
    await act(() => result.current.withoutDefault[1](null))

    expect(result.current.withDefault[0].test).toBe('next')

    await rerender({ defaultValue: 'latest' })
    expect(result.current.withDefault[0].test).toBe('latest')
  })
})

describe('useQueryStates: shared parse cache', () => {
  it('shares parsed values between hooks bound to the same key and parser', async () => {
    const objParser = parseAsJson<{ v: number }>(x => x as { v: number })
    const { result } = await renderHook(
      () => ({
        a: useQueryStates({ obj: objParser }),
        b: useQueryStates({ obj: objParser })
      }),
      {
        wrapper: withNuqsTestingAdapter({ searchParams: '?obj={"v":1}' })
      }
    )
    expect(result.current.a[0].obj).toEqual({ v: 1 })
    expect(result.current.b[0].obj).toBe(result.current.a[0].obj)
  })
})

describe('useQueryStates: optimistic adoption', () => {
  it('keeps the exact value identity for the writer (non-identity parse round-trip)', async () => {
    const objParser = parseAsJson<{ v: number }>(x => x as { v: number })
    const { result, act } = await renderHook(
      () => useQueryStates({ obj: objParser }),
      { wrapper: withNuqsTestingAdapter() }
    )
    const written = { v: 42 }
    await act(() => result.current[1]({ obj: written }))
    expect(result.current[0].obj).toBe(written)
  })
  it("re-parses the raw query with each hook's own parser (no typed-value adoption)", async () => {
    const { result, act } = await renderHook(
      () => ({
        str: useQueryStates({ id: parseAsString }),
        num: useQueryStates({ id: parseAsInteger })
      }),
      { wrapper: withNuqsTestingAdapter() }
    )
    await act(() => result.current.str[1]({ id: '42' }))
    expect(result.current.str[0].id).toBe('42')
    expect(result.current.num[0].id).toBe(42)
  })
})

describe('useQueryStates: debounce(Infinity)', () => {
  it('syncs the value to other hooks on the key and defers the URL update', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const { result, act } = await renderHook(
      () => ({
        a: useQueryStates({ test: parseAsString }),
        b: useQueryStates({ test: parseAsString })
      }),
      { wrapper: withNuqsTestingAdapter({ onUrlUpdate }) }
    )
    await act(async () => {
      result.current.a[1](
        { test: 'deferred' },
        { limitUrlUpdates: debounce(Infinity) }
      )
      await waitForNextTick()
    })
    expect(result.current.a[0].test).toBe('deferred')
    expect(result.current.b[0].test).toBe('deferred')
    expect(onUrlUpdate).not.toHaveBeenCalled()
  })
})

describe('useQueryStates: rendering & bail-out', () => {
  it('should render once on mount with an initial value in the URL', async () => {
    let renderBodyCount = 0
    function TestComponent() {
      renderBodyCount++
      const [{ test }] = useQueryStates({ test: parseAsString })
      return <div>value: {test}</div>
    }
    await render(<TestComponent />, {
      wrapper: withNuqsTestingAdapter({ searchParams: '?test=init' })
    })
    await expect.element(page.getByText('value: init')).toBeInTheDocument()
    expect(renderBodyCount).toBe(1)
  })

  it('should bail out of rendering the same component when setting to the same value', async () => {
    let renderCount = 0
    function TestComponent() {
      const [{ test }, setSearchParams] = useQueryStates({
        test: parseAsString
      })
      useEffect(() => {
        renderCount++
      })
      return (
        <>
          <button
            onClick={() => {
              setSearchParams(v => v)
            }}
          >
            Start
          </button>
          <div>value: {test}</div>
        </>
      )
    }
    const user = userEvent.setup()
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    await render(<TestComponent />, {
      wrapper: withNuqsTestingAdapter({
        onUrlUpdate,
        searchParams: '?test=init'
      })
    })
    await expect.element(page.getByText('value: init')).toBeInTheDocument()
    expect(renderCount).toBe(1)
    expect(onUrlUpdate).toHaveBeenCalledTimes(0)

    await user.click(page.getByRole('button', { name: 'Start' }))
    expect(renderCount).toBe(1) // same render count as before
    expect(onUrlUpdate).toHaveBeenCalledTimes(1) // url update is still called

    await user.click(page.getByRole('button', { name: 'Start' }))
    expect(renderCount).toBe(1)
    expect(onUrlUpdate).toHaveBeenCalledTimes(2)
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
    const { result, act } = await renderHook(useTestHook, {
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
    const { result, act } = await renderHook(useTestHook, {
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

  it('should have referential equality on the state updater function', async () => {
    const { result, rerender, act } = await renderHook(
      () => useQueryStates({ test: parseAsString }),
      {
        wrapper: withNuqsTestingAdapter()
      }
    )
    const [, setState1] = result.current
    await rerender()
    const [, setState2] = result.current
    expect(setState1).toBe(setState2)
    await act(() => setState2({ test: 'pass' }))
    const [, setState3] = result.current
    expect(setState1).toBe(setState3)
  })
})

describe('useQueryStates: clearOnDefault', () => {
  it('honors clearOnDefault: true by default', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const useTestHook = () =>
      useQueryStates({
        test: parseAsString.withDefault('default')
      })
    const { result, act } = await renderHook(useTestHook, {
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
    const { result, act } = await renderHook(useTestHook, {
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
    const { result, act } = await renderHook(useTestHook, {
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
    const { result, act } = await renderHook(useTestHook, {
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

  it('follows parser option changes', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    type Props = { history: 'push' | 'replace' }
    const useTestHook = ({ history }: Props = { history: 'replace' }) =>
      useQueryStates({
        defaultValue: parseAsString.withOptions({ history })
      })
    const initialProps: Props = { history: 'replace' }
    const { result, rerender, act } = await renderHook(useTestHook, {
      initialProps,
      wrapper: withNuqsTestingAdapter({ onUrlUpdate })
    })

    await rerender({ history: 'push' })
    await act(() => result.current[1]({ defaultValue: 'pass' }))

    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].options.history).toBe('push')
  })

  it('follows parser startTransition changes', async () => {
    const initialStartTransition = vi.fn((callback: () => void) => callback())
    const nextStartTransition = vi.fn((callback: () => void) => callback())
    const useTestHook = ({ startTransition = initialStartTransition } = {}) =>
      useQueryStates({
        test: parseAsString.withOptions({ startTransition })
      })
    const { result, rerender, act } = await renderHook(useTestHook, {
      wrapper: withNuqsTestingAdapter()
    })

    await rerender({ startTransition: nextStartTransition })
    await act(() => result.current[1]({ test: 'pass' }))

    expect(initialStartTransition).not.toHaveBeenCalled()
    expect(nextStartTransition).toHaveBeenCalledOnce()
  })

  it('follows hook-level clearOnDefault changes', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const useTestHook = (
      { clearOnDefault }: { clearOnDefault: boolean } = {
        clearOnDefault: true
      }
    ) =>
      useQueryStates(
        {
          test: parseAsString.withDefault('default')
        },
        { clearOnDefault }
      )
    const { result, rerender, act } = await renderHook(useTestHook, {
      initialProps: { clearOnDefault: true },
      wrapper: withNuqsTestingAdapter({
        searchParams: '?test=initial',
        onUrlUpdate
      })
    })

    await rerender({ clearOnDefault: false })
    await act(() => result.current[1]({ test: 'default' }))

    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].queryString).toBe('?test=default')
  })

  it('does not expose parser config from a discarded render to its setter', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const never = new Promise<void>(() => {})
    function TestComponent() {
      const [defaultValue, setDefaultValue] = useState('committed')
      const [{ test }, setQuery] = useQueryStates(
        {
          test: parseAsString.withDefault(defaultValue)
        },
        {
          urlKeys: { test: defaultValue }
        }
      )
      if (defaultValue === 'speculative') {
        throw never
      }
      return (
        <>
          <button
            onClick={() => {
              React.startTransition(() => setDefaultValue('speculative'))
            }}
          >
            Suspend
          </button>
          <button
            onClick={() => {
              setQuery(current => ({ test: `${current.test}!` }))
            }}
          >
            Update
          </button>
          <div>value: {test}</div>
        </>
      )
    }
    const user = userEvent.setup()
    await render(
      <React.Suspense fallback={<div>loading</div>}>
        <TestComponent />
      </React.Suspense>,
      {
        wrapper: withNuqsTestingAdapter({ onUrlUpdate })
      }
    )

    await user.click(page.getByRole('button', { name: 'Suspend' }))
    await user.click(page.getByRole('button', { name: 'Update' }))

    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].queryString).toBe(
      '?committed=committed!'
    )
  })
})

describe('useQueryStates: dynamic keys', () => {
  it.each(['constructor', 'hasOwnProperty'])(
    'supports adding a dynamic native array key named %s',
    async key => {
      const parser = parseAsNativeArrayOf(parseAsString)
      const useTestHook = (includePrototypeKey = false) => {
        const parsers: Record<string, typeof parser> = { a: parser }
        if (includePrototypeKey) {
          parsers[key] = parser
        }
        return useQueryStates(parsers)
      }
      const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
      const { result, rerender, act } = await renderHook(useTestHook, {
        wrapper: withNuqsTestingAdapter({
          searchParams: `?${key}=acme`,
          onUrlUpdate
        })
      })

      await act(() => result.current[1]({ [key]: ['ignored'] }))
      expect(onUrlUpdate).not.toHaveBeenCalled()
      await rerender(true)
      expect(Object.hasOwn(result.current[0], key)).toBe(true)
      expect(result.current[0][key]).toEqual(['acme'])
      await act(() => result.current[1]({ [key]: ['ajax'] }))
      expect(onUrlUpdate.mock.calls[0]![0].queryString).toBe(`?${key}=ajax`)
    }
  )

  it('supports dynamic keys', async () => {
    const useTestHook = (keys: [string, string] = ['a', 'b']) =>
      useQueryStates({
        [keys[0]]: parseAsInteger,
        [keys[1]]: parseAsInteger
      })
    const { result, rerender } = await renderHook(useTestHook, {
      wrapper: withNuqsTestingAdapter({
        searchParams: '?a=1&b=2&c=3&d=4'
      })
    })
    expect(result.current[0].a).toEqual(1)
    expect(result.current[0].b).toEqual(2)
    expect(result.current[0].c).toBeUndefined()
    expect(result.current[0].d).toBeUndefined()
    await rerender(['c', 'd'])
    expect(result.current[0].a).toBeUndefined()
    expect(result.current[0].b).toBeUndefined()
    expect(result.current[0].c).toEqual(3)
    expect(result.current[0].d).toEqual(4)
  })

  it('updating keys also updates the result structure', async () => {
    const useTestHook = (keys: string[] = ['a', 'b']) =>
      useQueryStates(
        keys.reduce((acc, key) => ({ ...acc, [key]: parseAsInteger }), {})
      )
    const { result, rerender } = await renderHook(useTestHook, {
      wrapper: withNuqsTestingAdapter({
        searchParams: ''
      })
    })
    expect(result.current[0]).toStrictEqual({ a: null, b: null })
    await rerender(['a']) // remove b
    expect(result.current[0]).toStrictEqual({ a: null })
    await rerender(['a', 'b', 'c']) // add c
    expect(result.current[0]).toStrictEqual({ a: null, b: null, c: null })
    await rerender(['a', 'b', 'd']) // remove c, add d
    expect(result.current[0]).toStrictEqual({ a: null, b: null, d: null })
  })

  it('moves the cross-hook subscriptions when the key set changes', async () => {
    const useTestHook = (keys: string[] = ['a']) => ({
      dynamic: useQueryStates(
        Object.fromEntries(keys.map(key => [key, parseAsString]))
      ),
      a: useQueryStates({ a: parseAsString }),
      b: useQueryStates({ b: parseAsString })
    })
    const { result, rerender, act } = await renderHook(useTestHook, {
      wrapper: withNuqsTestingAdapter({ searchParams: '' })
    })
    await rerender(['b'])
    await act(() => result.current.a[1]({ a: 'stale' }))
    expect(result.current.dynamic[0]).toStrictEqual({ b: null })
    await act(() => result.current.b[1]({ b: 'live' }))
    expect(result.current.dynamic[0]).toStrictEqual({ b: 'live' })
  })

  it('supports dynamic keys with remapping', async () => {
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
    const { result, rerender } = await renderHook(useTestHook, {
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
    await rerender(['c', 'd'])
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
    const { result, act } = await renderHook(
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
    const { result, act } = await renderHook(
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
    const { result, act } = await renderHook(
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
    const { result, act } = await renderHook(
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
    const { result, act } = await renderHook(
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
    const { result, act } = await renderHook(
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
    const { result, act } = await renderHook(
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
    const { result, act } = await renderHook(
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
    const { result, act } = await renderHook(
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
    const { result, act } = await renderHook(
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

  it('flushes the throttled key and debounces the other in a single update', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const { result, act } = await renderHook(
      () =>
        useQueryStates({
          a: parseAsString.withOptions({ limitUrlUpdates: debounce(100) }),
          b: parseAsString
        }),
      {
        wrapper: withNuqsTestingAdapter({
          onUrlUpdate,
          rateLimitFactor: 1,
          hasMemory: true
        })
      }
    )
    let p: Promise<URLSearchParams> | undefined = undefined
    await act(async () => {
      p = result.current[1]({ a: 'slow', b: 'fast' })
      await vi.waitFor(() => expect(onUrlUpdate).toHaveBeenCalledOnce())
    })
    expect(onUrlUpdate.mock.calls[0]![0].queryString).toEqual('?b=fast')
    await expect(p).resolves.toEqual(new URLSearchParams('?b=fast&a=slow'))
    expect(onUrlUpdate).toHaveBeenCalledTimes(2)
    expect(onUrlUpdate.mock.calls[1]![0].queryString).toEqual('?b=fast&a=slow')
  })

  it('does flush when pushing throttled updates', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const { result, act } = await renderHook(
      () => useQueryStates({ test: parseAsString }),
      {
        wrapper: withNuqsTestingAdapter({
          onUrlUpdate,
          autoResetQueueOnUpdate: false
        })
      }
    )
    let p: Promise<URLSearchParams> | undefined = undefined
    await act(async () => {
      p = result.current[1](
        { test: 'pass' },
        { limitUrlUpdates: throttle(100) }
      )
      await waitForNextTick()
    })
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].queryString).toEqual('?test=pass')
    await expect(p).resolves.toEqual(new URLSearchParams('?test=pass'))
  })

  it('does not flush when pushing debounced updates', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const { result, act } = await renderHook(
      () => useQueryStates({ test: parseAsString }),
      {
        wrapper: withNuqsTestingAdapter({
          onUrlUpdate,
          autoResetQueueOnUpdate: false
        })
      }
    )
    // Flush a first time without resetting the queue to keep pending items
    // in the global throttle queue.
    await act(() => result.current[1]({ test: 'init' }))
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].queryString).toEqual('?test=init')
    onUrlUpdate.mockClear()
    // Now push a debounced update, which should not flush immediately
    let p: Promise<URLSearchParams> | undefined = undefined
    await act(async () => {
      p = result.current[1](
        { test: 'pass' },
        { limitUrlUpdates: debounce(100) }
      )
      await waitForNextTick()
    })
    expect(onUrlUpdate).not.toHaveBeenCalled()
    await expect(p).resolves.toEqual(new URLSearchParams('?test=pass'))
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].queryString).toEqual('?test=pass')
  })
})

describe('limitUrlUpdates precedence', () => {
  it('call-level throttle overrides global debounce', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const { result, act } = await renderHook(
      () =>
        useQueryStates(
          { test: parseAsString },
          { limitUrlUpdates: debounce(300) }
        ),
      {
        wrapper: withNuqsTestingAdapter({
          onUrlUpdate
        })
      }
    )
    let p: Promise<URLSearchParams> | undefined = undefined
    await act(async () => {
      p = result.current[1]({ test: 'pass' }, { limitUrlUpdates: throttle(50) })
      await waitForNextTick()
    })
    // A real throttle flushes on the next tick.
    // A debounce would still be waiting out its timer.
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].queryString).toEqual('?test=pass')
    await expect(p).resolves.toEqual(new URLSearchParams('?test=pass'))
  })

  it('parser-level throttle overrides global debounce', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const { result, act } = await renderHook(
      () =>
        useQueryStates(
          {
            test: parseAsString.withOptions({
              limitUrlUpdates: throttle(50)
            })
          },
          { limitUrlUpdates: debounce(300) }
        ),
      {
        wrapper: withNuqsTestingAdapter({
          onUrlUpdate
        })
      }
    )
    let p: Promise<URLSearchParams> | undefined = undefined
    await act(async () => {
      p = result.current[1]({ test: 'pass' })
      await waitForNextTick()
    })
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].queryString).toEqual('?test=pass')
    await expect(p).resolves.toEqual(new URLSearchParams('?test=pass'))
  })

  it('parser-level debounce timeMs overrides global debounce timeMs', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const { result, act } = await renderHook(
      () =>
        useQueryStates(
          {
            test: parseAsString.withOptions({
              limitUrlUpdates: debounce(50)
            })
          },
          { limitUrlUpdates: debounce(500) }
        ),
      {
        wrapper: withNuqsTestingAdapter({
          onUrlUpdate
        })
      }
    )
    let p: Promise<URLSearchParams> | undefined = undefined
    await act(async () => {
      p = result.current[1]({ test: 'pass' })
      // Past the parser's 50ms debounce.
      // Short of the global 500ms one.
      await new Promise(resolve => setTimeout(resolve, 150))
    })
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].queryString).toEqual('?test=pass')
    await expect(p).resolves.toEqual(new URLSearchParams('?test=pass'))
  })

  it('parser-level debounce alone still debounces (no global set)', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const { result, act } = await renderHook(
      () =>
        useQueryStates({
          test: parseAsString.withOptions({
            limitUrlUpdates: debounce(100)
          })
        }),
      {
        wrapper: withNuqsTestingAdapter({
          onUrlUpdate
        })
      }
    )
    let p: Promise<URLSearchParams> | undefined = undefined
    await act(async () => {
      p = result.current[1]({ test: 'pass' })
      await waitForNextTick()
    })
    // Still pending: the debounce timer hasn't elapsed yet.
    expect(onUrlUpdate).not.toHaveBeenCalled()
    await expect(p).resolves.toEqual(new URLSearchParams('?test=pass'))
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].queryString).toEqual('?test=pass')
  })
})

describe('useQueryStates: adapter defaults', () => {
  it('should use adapter default value for `shallow` when provided', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const useTestHook = () => useQueryStates({ test: parseAsString })
    const { result, act } = await renderHook(useTestHook, {
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
  it('should let call-level `shallow` override parser options', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const useTestHook = () =>
      useQueryStates({
        test: parseAsString.withOptions({ shallow: false })
      })
    const { result, act } = await renderHook(useTestHook, {
      wrapper: withNuqsTestingAdapter({ onUrlUpdate })
    })

    await act(() => result.current[1]({ test: 'update' }, { shallow: true }))
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].options.shallow).toBe(true)
  })
  it('should use adapter default value for `scroll` when provided', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const useTestHook = () => useQueryStates({ test: parseAsString })
    const { result, act } = await renderHook(useTestHook, {
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
    const { result, act } = await renderHook(useTestHook, {
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
  it('should use adapter default value for `history` when provided', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const useTestHook = () => useQueryStates({ test: parseAsString })
    const { result, act } = await renderHook(useTestHook, {
      wrapper: withNuqsTestingAdapter({
        defaultOptions: {
          history: 'push'
        },
        onUrlUpdate
      })
    })
    await act(() => result.current[1]({ test: 'update' }))
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].options.history).toBe('push')
  })
  it('should let a call-level `history` override the adapter default', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const useTestHook = () => useQueryStates({ test: parseAsString })
    const { result, act } = await renderHook(useTestHook, {
      wrapper: withNuqsTestingAdapter({
        defaultOptions: {
          history: 'push'
        },
        onUrlUpdate
      })
    })
    await act(() =>
      result.current[1]({ test: 'update' }, { history: 'replace' })
    )
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].options.history).toBe('replace')
  })
  it('should let a parser-level `history` override the adapter default', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const useTestHook = () =>
      useQueryStates({
        test: parseAsString.withOptions({ history: 'replace' })
      })
    const { result, act } = await renderHook(useTestHook, {
      wrapper: withNuqsTestingAdapter({
        defaultOptions: {
          history: 'push'
        },
        onUrlUpdate
      })
    })
    await act(() => result.current[1]({ test: 'update' }))
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].options.history).toBe('replace')
  })
})

describe('useQueryStates: process url search params', () => {
  it('should use adapter processUrlSearchParams when provided', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const useTestHook = () => useQueryStates({ test: parseAsString })
    const { result, act } = await renderHook(useTestHook, {
      wrapper: withNuqsTestingAdapter({
        processUrlSearchParams: search => {
          const params = new URLSearchParams(search)
          params.set('test', 'processed')
          return params
        },
        onUrlUpdate
      })
    })
    await act(() => result.current[1]({ test: 'update' }))
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].queryString).toBe('?test=processed')
  })
  it('should follow changes in the processUrlSearchParams callback', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    function DynamicWrapper({ children }: { children: ReactNode }) {
      const [process, setProcess] = useState(false)
      // Who needs JSX in tests anyway?
      return createElement(NuqsTestingAdapter, {
        onUrlUpdate,
        processUrlSearchParams: process
          ? search => {
              search.set('test', 'processed')
              return search
            }
          : undefined,
        children: [
          createElement('button', {
            key: 'btn',
            onClick: () => setProcess(p => !p),
            'data-testid': 'btn',
            'data-state': process ? 'on' : 'off'
          }),
          children
        ]
      })
    }
    const useTestHook = () => useQueryStates({ test: parseAsString })
    const { result, act } = await renderHook(useTestHook, {
      wrapper: DynamicWrapper
    })
    const button = page.getByTestId('btn')
    expect(button.element().getAttribute('data-state')).toBe('off')
    await act(() => result.current[1]({ test: 'pass' }))
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].queryString).toBe('?test=pass')
    onUrlUpdate.mockReset()
    await act(() => button.click())
    expect(button.element().getAttribute('data-state')).toBe('on')
    await act(() => result.current[1]({ test: 'fail-if-kept' }))
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].queryString).toBe('?test=processed')
  })
  it('should call processUrlSearchParams after a debounced update', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const useTestHook = () => useQueryStates({ test: parseAsString })
    const { result, act } = await renderHook(useTestHook, {
      wrapper: withNuqsTestingAdapter({
        processUrlSearchParams: search => {
          expect(search.get('test')).toBe('fail')
          search.set('test', 'pass')
          return search
        },
        onUrlUpdate
      })
    })
    await act(async () => {
      await result.current[1](
        { test: 'fail' },
        { limitUrlUpdates: debounce(50) }
      )
    })
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].queryString).toBe('?test=pass')
  })
  it('should use the latest processUrlSearchParams when restarting a debounce', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    function DynamicWrapper({ children }: { children: ReactNode }) {
      const [config, setConfig] = useState<'a' | 'b'>('a')
      return createElement(NuqsTestingAdapter, {
        onUrlUpdate,
        processUrlSearchParams: search => {
          search.set('config', config)
          return search
        },
        rateLimitFactor: 1,
        children: [
          createElement('button', {
            key: 'btn',
            onClick: () => setConfig('b'),
            'data-testid': 'btn'
          }),
          children
        ]
      })
    }
    try {
      const { result, act } = await renderHook(
        () => useQueryStates({ test: parseAsString }),
        { wrapper: DynamicWrapper }
      )
      await act(() => {
        void result.current[1](
          { test: 'first' },
          { limitUrlUpdates: debounce(100) }
        )
      })
      await act(() => page.getByTestId('btn').click())
      await act(() => {
        void result.current[1](
          { test: 'second' },
          { limitUrlUpdates: debounce(100) }
        )
      })
      await act(() => vi.advanceTimersByTimeAsync(200))

      expect(onUrlUpdate).toHaveBeenCalledOnce()
      expect(onUrlUpdate.mock.calls[0]![0].queryString).toBe(
        '?test=second&config=b'
      )
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('useQueryStates: edge cases & repros', () => {
  it('should not go through transient old state when combined with another state update (#1099)', async () => {
    function TestComponent() {
      const [{ test }, setSearchParams] = useQueryStates({
        test: parseAsString
      })
      const [isNullDetectorEnabled, setIsNullDetectorEnabled] = useState(false)
      const { isLoading, stopLoading } = useFakeLoadingState(test)
      return (
        <>
          <button
            onClick={() => {
              setIsNullDetectorEnabled(true)
              setSearchParams({ test: 'pass' })
            }}
          >
            Start
          </button>
          <button onClick={stopLoading}>Stop</button>
          <NullDetector
            state={test}
            enabled={isNullDetectorEnabled}
            data-testid="null-detector"
          />
          <p>isLoading: {String(isLoading)}</p>
        </>
      )
    }
    const user = userEvent.setup()
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    render(<TestComponent />, {
      wrapper: withNuqsTestingAdapter({
        onUrlUpdate,
        hasMemory: true // needs memory for the test to pass
      })
    })
    await expect
      .element(page.getByTestId('null-detector'))
      .toHaveTextContent('pass')
    await expect.element(page.getByText('isLoading: false')).toBeInTheDocument()
    await user.click(page.getByRole('button', { name: 'Start' }))
    await expect.element(page.getByText('isLoading: true')).toBeInTheDocument()
    await user.click(page.getByRole('button', { name: 'Stop' }))
    await expect.element(page.getByText('isLoading: false')).toBeInTheDocument()
    await expect
      .element(page.getByTestId('null-detector'))
      .toHaveTextContent('pass')
  })
})

describe('useQueryStates: discarded renders', () => {
  const { NuqsAdapter, useOptimisticSearchParams } =
    createReactRouterBasedAdapter({
      adapter: 'test-discarded-render',
      useNavigate: () => () => {},
      useSearchParams: (initial): [URLSearchParams, {}] => [initial, {}]
    })

  const originalUrl = location.href

  afterEach(() => {
    history.replaceState(null, '', originalUrl)
  })

  it('recovers after an external navigation discards a render', async () => {
    const hold = new Promise<never>(() => {})

    function Value() {
      const [value] = useQueryState('test')
      return <div data-testid="value">{String(value)}</div>
    }

    function SuspendOnIncomingParams() {
      const searchParams = useOptimisticSearchParams()
      if (searchParams.get('test') === 'incoming') {
        throw hold
      }
      return null
    }

    function App() {
      const [count, setCount] = useState(0)
      return (
        <NuqsAdapter>
          <button onClick={() => setCount(count => count + 1)}>
            Count ({count})
          </button>
          <Value />
          <Suspense fallback={null}>
            <SuspendOnIncomingParams />
          </Suspense>
        </NuqsAdapter>
      )
    }

    history.replaceState(null, '', '/page?test=old')
    render(<App />)
    await expect.element(page.getByTestId('value')).toHaveTextContent('old')

    history.pushState(null, '', '/page?test=incoming')
    await new Promise(resolve => setTimeout(resolve, 100))
    await expect.element(page.getByTestId('value')).toHaveTextContent('old')

    history.pushState(null, '', '/elsewhere?test=incoming')

    const user = userEvent.setup()
    const count = page.getByRole('button', { name: /Count/ })
    await user.click(count)
    await expect.element(count).toHaveTextContent('Count (1)')
    await expect
      .element(page.getByTestId('value'), { timeout: 2000 })
      .toHaveTextContent('incoming')

    await user.click(count)
    await expect.element(count).toHaveTextContent('Count (2)')
    await expect
      .element(page.getByTestId('value'))
      .toHaveTextContent('incoming')
  })
})

describe('useQueryStates: transition lane feedback', () => {
  const { NuqsAdapter } = createReactRouterBasedAdapter({
    adapter: 'test-transition-lane-feedback',
    useNavigate: () => () => {},
    useSearchParams: initial => [initial, {}]
  })
  const feedbackListeners = new Set<() => void>()
  let feedbackState: string | null | undefined
  let feedbackUpdates = 0
  let feedbackUpdateLimit = 20

  function subscribeFeedback(listener: () => void) {
    feedbackListeners.add(listener)
    return () => feedbackListeners.delete(listener)
  }

  function publishFeedback(value: string | null) {
    if (feedbackState === value || feedbackUpdates >= feedbackUpdateLimit)
      return
    feedbackState = value
    feedbackUpdates++
    feedbackListeners.forEach(listener => listener())
  }

  function Probe({ renders }: { renders: Array<string | null> }) {
    const [{ value }, setState] = useQueryStates({
      value: parseAsString.withOptions({
        history: 'replace',
        limitUrlUpdates: throttle(500)
      })
    })
    useSyncExternalStore(
      subscribeFeedback,
      () => feedbackState,
      () => feedbackState
    )
    const [, setTick] = useState(0)
    renders.push(value)

    useLayoutEffect(() => publishFeedback(value), [value])

    return (
      <>
        <button
          data-testid="write"
          onClick={() => {
            startTransition(() => void setState({ value: 'B' }))
          }}
        />
        <button
          data-testid="sync-write"
          onClick={() => void setState({ value: 'B' })}
        />
        <button data-testid="tick" onClick={() => setTick(tick => tick + 1)} />
      </>
    )
  }

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
  const distinct = (values: Array<string | null>) =>
    values.filter((value, index) => index === 0 || value !== values[index - 1])
  const click = (testId: string) =>
    page
      .getByTestId(testId)
      .element()
      .dispatchEvent(new MouseEvent('click', { bubbles: true }))

  afterEach(() => {
    cleanup()
    resetQueues()
    feedbackListeners.clear()
    feedbackState = undefined
    feedbackUpdates = 0
    feedbackUpdateLimit = 20
    const url = new URL(location.href)
    url.searchParams.delete('value')
    history.replaceState(history.state, '', url)
  })

  async function mount() {
    globalThrottleQueue.lastFlushedAt = performance.now()
    const renders: Array<string | null> = []
    await render(
      <NuqsAdapter>
        <Probe renders={renders} />
      </NuqsAdapter>
    )
    renders.splice(0, renders.length - 1)
    return renders
  }

  it('converges when a later sync render feeds back through layout effects', async () => {
    const renders = await mount()
    click('write')
    click('tick')
    await sleep(100)

    expect(renders[1]).toBe(null)
    expect(distinct(renders)).toEqual([null, 'B'])
  })

  it('does not overflow with uncapped external-store feedback (#1567)', async () => {
    feedbackUpdateLimit = Infinity
    const renders = await mount()
    click('write')
    click('tick')
    await sleep(100)

    expect(renders[1]).toBe(null)
    expect(distinct(renders)).toEqual([null, 'B'])
    expect(feedbackUpdates).toBeLessThanOrEqual(2)
  })

  it('promotes a repeated transition value to the sync lane', async () => {
    const renders = await mount()
    click('write')
    click('sync-write')
    click('tick')
    await sleep(100)

    expect(renders[1]).toBe('B')
  })
})
