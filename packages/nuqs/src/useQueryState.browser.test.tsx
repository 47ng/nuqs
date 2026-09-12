import React, {
  startTransition,
  useCallback,
  useEffect,
  useLayoutEffect,
  useState
} from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, renderHook } from 'vitest-browser-react'
import { page, userEvent } from 'vitest/browser'
import {
  NullDetector,
  useFakeLoadingState
} from '../tests/components/repro-1099'
import {
  unstable_createAdapterProvider,
  type unstable_AdapterInterface
} from './adapters/custom'
import { NuqsAdapter as ReactAdapter } from './adapters/react'
import {
  withNuqsTestingAdapter,
  type OnUrlUpdateFunction
} from './adapters/testing'
import { debounce, throttle } from './lib/queues/rate-limiting'
import { resetQueues } from './lib/queues/reset'
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsJson,
  parseAsNativeArrayOf,
  parseAsString
} from './parsers'
import { useQueryState } from './useQueryState'

const waitForNextTick = () =>
  new Promise<void>(resolve => {
    setTimeout(resolve, 0)
  })

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

  it('should have referential equality on default values', async () => {
    const { result } = await renderHook(useTestHookWithDefaults, {
      wrapper: withNuqsTestingAdapter()
    })
    const { str, obj, arr } = result.current
    expect(str[0]).toBe(defaults.str)
    expect(obj[0]).toBe(defaults.obj)
    expect(arr[0]).toBe(defaults.arr)
    expect(arr[0][0]).toBe(defaults.arr[0])
  })

  it('should keep referential equality when resetting to defaults', async () => {
    const { result, act } = await renderHook(useTestHookWithDefaults, {
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
    const { result, act } = await renderHook(useTestHookWithDefaults, {
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

  it('should keep referential equality when default changes for another key', async () => {
    const { result, rerender } = await renderHook(useTestHookWithDefaults, {
      wrapper: withNuqsTestingAdapter()
    })
    expect(result.current.str[0]).toBe('foo')
    await rerender({ defaultValue: 'b' })
    const { str, obj, arr } = result.current
    expect(str[0]).toBe('b')
    expect(obj[0]).toBe(defaults.obj)
    expect(arr[0]).toBe(defaults.arr)
    expect(arr[0][0]).toBe(defaults.arr[0])
  })

  it('should have referential equality on the state updater function', async () => {
    const { result, rerender, act } = await renderHook(
      () => useQueryState('test'),
      {
        wrapper: withNuqsTestingAdapter()
      }
    )
    const [, setState1] = result.current
    await rerender()
    const [, setState2] = result.current
    expect(setState1).toBe(setState2)
    await act(() => setState1('pass'))
    const [, setState3] = result.current
    expect(setState1).toBe(setState3)
  })

  it('keeps an equal default value reference when hook options change', async () => {
    const useTestHook = (history: 'replace' | 'push' = 'replace') =>
      useQueryState(
        'test',
        parseAsNativeArrayOf(parseAsString)
          .withDefault([])
          .withOptions({ history })
      )
    const { result, rerender } = await renderHook(useTestHook, {
      wrapper: withNuqsTestingAdapter()
    })
    const defaultValue = result.current[0]

    await rerender('push')

    expect(result.current[0]).toBe(defaultValue)
  })
})

describe('useQueryState: clearOnDefault', () => {
  it('honors clearOnDefault: true by default', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const { result, act } = await renderHook(
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
    const { result, act } = await renderHook(useTestHook, {
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
    const { result, act } = await renderHook(useTestHook, {
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
    const { result, act } = await renderHook(() => useQueryState('test'), {
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
    const { result, act } = await renderHook(
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
    const { result, act } = await renderHook(() => useQueryState('test'), {
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
    const { result, act } = await renderHook(
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
    const { result, act } = await renderHook(
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
      return new Promise(resolve => setTimeout(resolve, 30))
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
  it('aborts a debounced update when pushing a throttled one', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const { result, act } = await renderHook(() => useQueryState('test'), {
      wrapper: withNuqsTestingAdapter({
        onUrlUpdate,
        rateLimitFactor: 1
      })
    })
    let p1: Promise<URLSearchParams> | undefined = undefined
    let p2: Promise<URLSearchParams> | undefined = undefined
    await act(async () => {
      p1 = result.current[1]('a', { limitUrlUpdates: debounce(100) })
      p2 = result.current[1]('b')
      return Promise.allSettled([p1, p2])
    })
    expect(p1).toBeInstanceOf(Promise)
    expect(p2).toBeInstanceOf(Promise)
    expect(p1).not.toBe(p2)
    await expect(p1).resolves.toEqual(new URLSearchParams('?test=b'))
    await expect(p2).resolves.toEqual(new URLSearchParams('?test=b'))
    expect(onUrlUpdate).toHaveBeenCalledTimes(1)
    expect(onUrlUpdate.mock.calls[0]![0].queryString).toEqual('?test=b')
  })

  it('does flush when pushing throttled updates', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const { result, act } = await renderHook(() => useQueryState('test'), {
      wrapper: withNuqsTestingAdapter({
        onUrlUpdate,
        autoResetQueueOnUpdate: false
      })
    })
    let p: Promise<URLSearchParams> | undefined = undefined
    await act(async () => {
      p = result.current[1]('pass', { limitUrlUpdates: throttle(100) })
      await waitForNextTick()
    })
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].queryString).toEqual('?test=pass')
    await expect(p).resolves.toEqual(new URLSearchParams('?test=pass'))
  })

  it('does not flush when pushing debounced updates', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const { result, act } = await renderHook(() => useQueryState('test'), {
      wrapper: withNuqsTestingAdapter({
        onUrlUpdate,
        autoResetQueueOnUpdate: false
      })
    })
    // Flush a first time without resetting the queue to keep pending items
    // in the global throttle queue.
    await act(() => result.current[1]('init'))
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].queryString).toEqual('?test=init')
    onUrlUpdate.mockClear()
    // Now push a debounced update, which should not flush immediately
    let p: Promise<URLSearchParams> | undefined = undefined
    await act(async () => {
      p = result.current[1]('pass', { limitUrlUpdates: debounce(100) })
      await waitForNextTick()
    })
    expect(onUrlUpdate).not.toHaveBeenCalled()
    await expect(p).resolves.toEqual(new URLSearchParams('?test=pass'))
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].queryString).toEqual('?test=pass')
  })
})

describe('useQueryState: adapter defaults', () => {
  it('should use adapter default value for `shallow` when provided', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const { result, act } = await renderHook(() => useQueryState('test'), {
      wrapper: withNuqsTestingAdapter({
        defaultOptions: {
          shallow: false
        },
        onUrlUpdate
      })
    })
    await act(() => result.current[1]('update'))
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].options.shallow).toBe(false)
  })
  it('should use adapter default value for `scroll` when provided', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const { result, act } = await renderHook(() => useQueryState('test'), {
      wrapper: withNuqsTestingAdapter({
        defaultOptions: {
          scroll: true
        },
        onUrlUpdate
      })
    })
    await act(() => result.current[1]('update'))
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].options.scroll).toBe(true)
  })
  it('should use adapter default value for `clearOnDefault` when provided', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const { result, act } = await renderHook(
      () => useQueryState('test', { defaultValue: 'pass' }),
      {
        wrapper: withNuqsTestingAdapter({
          defaultOptions: {
            clearOnDefault: false
          },
          onUrlUpdate
        })
      }
    )
    await act(() => result.current[1]('pass'))
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].queryString).toBe('?test=pass')
  })
  it('should use adapter default value for `history` when provided', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const { result, act } = await renderHook(() => useQueryState('test'), {
      wrapper: withNuqsTestingAdapter({
        defaultOptions: {
          history: 'push'
        },
        onUrlUpdate
      })
    })
    await act(() => result.current[1]('update'))
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].options.history).toBe('push')
  })
  it('should let a call-level `history` override the adapter default', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const { result, act } = await renderHook(() => useQueryState('test'), {
      wrapper: withNuqsTestingAdapter({
        defaultOptions: {
          history: 'push'
        },
        onUrlUpdate
      })
    })
    await act(() => result.current[1]('update', { history: 'replace' }))
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].options.history).toBe('replace')
  })
})

describe('useQueryState: edge cases & repros', () => {
  it('should not go through transient old state when combined with another state update (#1099)', async () => {
    function TestComponent() {
      const [state, setState] = useQueryState('test')
      const [isNullDetectorEnabled, setIsNullDetectorEnabled] = useState(false)
      const { isLoading, stopLoading } = useFakeLoadingState(state)
      return (
        <>
          <button
            onClick={() => {
              setIsNullDetectorEnabled(true)
              setState('pass')
            }}
          >
            Start
          </button>
          <button onClick={stopLoading}>Stop</button>
          <NullDetector
            state={state}
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

describe('useQueryState: multi-parsers', () => {
  it('should clear the url when defaults are set', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const { result, act } = await renderHook(
      () =>
        useQueryState(
          'test',
          parseAsNativeArrayOf(parseAsInteger).withDefault([42])
        ),
      {
        wrapper: withNuqsTestingAdapter({
          searchParams: '?test=1&test=2&test=3',
          onUrlUpdate
        })
      }
    )
    expect(result.current[0]).toEqual([1, 2, 3])
    await act(() => result.current[1]([42]))
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].queryString).toEqual('')
  })

  it('should add an empty param when set to empty array and there is a different default', async () => {
    const onUrlUpdate = vi.fn<OnUrlUpdateFunction>()
    const { result, act } = await renderHook(
      () =>
        useQueryState(
          'test',
          parseAsNativeArrayOf(parseAsInteger).withDefault([42])
        ),
      {
        wrapper: withNuqsTestingAdapter({
          searchParams: '?test=1&test=2&test=3',
          onUrlUpdate
        })
      }
    )
    expect(result.current[0]).toEqual([1, 2, 3])
    await act(() => result.current[1]([]))
    expect(onUrlUpdate).toHaveBeenCalledOnce()
    expect(onUrlUpdate.mock.calls[0]![0].queryString).toEqual('?test=')
  })
})

// --- SyncLane / transition-lane leak (#1567) --------------------------------

/**
 * A URL write made inside `startTransition` landed on a transition lane, but a
 * discrete event dispatched before that transition commits forces a SyncLane
 * render, which skips that lane. nuqs used to hand the sync render the pending
 * value anyway: it mutated `stateRef.current` outside the render that consumed
 * it, then render-time recovery fed it back in. The sync render saw 'B' while
 * the component state still held null. A layout effect dispatching from that
 * value then re-rendered into the same sync commit, and the two values
 * alternated instead of settling.
 *
 * The sandwich is deterministic, not raced:
 *   1. `startTransition(() => setTime('B'))` — the setter calls
 *      `setInternalState` synchronously, so nuqs's state update lands inside
 *      the transition.
 *   2. a click dispatched synchronously right after — discrete, so React
 *      flushes it before the transition commits.
 *   3. the probe records the value each render was handed.
 *
 * Both adapters are exercised: `lagging` models react-router (searchParams is
 * React state written inside startTransition), `react` is the shipped adapter
 * (searchParams comes from useSyncExternalStore, so it is lane-independent).
 */

// A react-router-shaped adapter, faithful to src/adapters/lib/react-router.ts:
// the emitter update is wrapped in startTransition; the history write is not.
type Listener = (search: URLSearchParams) => void
const listeners = new Set<Listener>()

function useLaggingAdapter(): unstable_AdapterInterface {
  const [searchParams, setSearchParams] = useState(
    () => new URLSearchParams(location.search)
  )
  useEffect(() => {
    const onUpdate: Listener = search => {
      startTransition(() => setSearchParams(new URLSearchParams(search)))
    }
    listeners.add(onUpdate)
    return () => void listeners.delete(onUpdate)
  }, [])
  const updateUrl = useCallback((search: URLSearchParams) => {
    startTransition(() => listeners.forEach(l => l(search)))
    const url = new URL(location.href)
    url.search = search.toString()
    history.replaceState(history.state, '', url)
  }, [])
  return { searchParams, updateUrl, autoResetQueueOnUpdate: false }
}

const adapters = {
  lagging: unstable_createAdapterProvider(useLaggingAdapter),
  react: ReactAdapter
}

/** Safety cap in case a future regression turns the alternation into a runaway. */
const RENDER_LIMIT = 60

function Probe({
  renders,
  wrapped
}: {
  renders: Array<string | null>
  wrapped: boolean
}) {
  const [time, setTime] = useQueryState(
    'time',
    // Minimise delayed URL work; the setter's synchronous `setInternalState`
    // determines the state update's lane, not the throttled queue flush.
    parseAsString.withOptions({ limitUrlUpdates: throttle(0) })
  )
  const [, setMeasured] = useState<string | null>(null)
  // The tick lives in this component on purpose: a discrete click on a sibling
  // marks only the sibling's fiber, and this component would never re-render.
  const [, setTick] = useState(0)
  renders.push(time)
  // Virtuoso-ish: measure during the commit and dispatch synchronously.
  // Convergent on its own — React bails out (Object.is) once `time` holds
  // still, so an unbounded render count means the value alternated.
  useLayoutEffect(() => {
    if (renders.length < RENDER_LIMIT) {
      setMeasured(time)
    }
  }, [time])
  return (
    <>
      <button
        data-testid="write"
        onClick={() => {
          if (wrapped) {
            startTransition(() => {
              setTime('B')
            })
          } else {
            setTime('B')
          }
        }}
      >
        write
      </button>
      <button data-testid="tick" onClick={() => setTick(t => t + 1)}>
        {String(time)}
      </button>
    </>
  )
}

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

/** Compresses the renders to the sequence of distinct values, in order. */
function distinctValues(renders: Array<string | null>) {
  return renders.filter((v, i, a) => i === 0 || !Object.is(v, a[i - 1]))
}

describe('useQueryState: SyncLane / transition-lane leak', () => {
  // nuqs's queues and the adapter emitter are module-level singletons, and the
  // react adapter writes to the real URL, so both need explicit teardown.
  // Only drop our own key so teardown leaves the runner's sessionId/iframeId
  // parameters untouched.
  beforeEach(clearTimeParam)
  afterEach(clearTimeParam)

  function clearTimeParam() {
    cleanup()
    listeners.clear()
    resetQueues()
    const url = new URL(location.href)
    url.searchParams.delete('time')
    history.replaceState(history.state, '', url)
  }

  async function mount(adapter: keyof typeof adapters, wrapped: boolean) {
    const Adapter = adapters[adapter]
    const renders: Array<string | null> = []
    await render(
      <Adapter>
        <Probe renders={renders} wrapped={wrapped} />
      </Adapter>
    )
    await sleep(50)
    // Keep the last mount render as the baseline, so the value sequence shows
    // the move out of the pre-write value rather than starting after it.
    renders.splice(0, renders.length - 1)
    // Dispatched directly rather than through userEvent, which awaits between
    // clicks and would let the transition commit before the tick lands.
    const click = (testId: string) => () =>
      page
        .getByTestId(testId)
        .element()
        .dispatchEvent(new MouseEvent('click', { bubbles: true }))
    return { renders, write: click('write'), tick: click('tick') }
  }

  for (const adapter of ['lagging', 'react'] as const) {
    it(`converges when a sync render interrupts a transition (${adapter} adapter)`, async () => {
      const probe = await mount(adapter, true)
      probe.write() // click handler starts the transition, as an app would
      probe.tick() // discrete click -> SyncLane, before the transition commits
      await sleep(300)

      // The sync render must not leak the pending transition value.
      expect(probe.renders[1]).toBe(null)
      // The URL moved once, so the rendered value must move once: null -> 'B'.
      expect(distinctValues(probe.renders)).toEqual([null, 'B'])
    })

    // Control. The write is discrete here (it happens in a click handler), so
    // nuqs's setInternalState commits at the end of that click, before the tick
    // renders — there is no pending lane for a sync render to skip. Renders go
    // [null, 'B', 'B'] rather than alternating.
    it(`converges when a sync render interrupts a plain update (${adapter} adapter)`, async () => {
      const probe = await mount(adapter, false)
      probe.write()
      probe.tick()
      await sleep(300)

      expect(distinctValues(probe.renders)).toEqual([null, 'B'])
    })
  }
})
