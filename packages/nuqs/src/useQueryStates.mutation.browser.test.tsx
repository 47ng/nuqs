import React, {
  createElement,
  startTransition,
  Suspense,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react'
import { flushSync } from 'react-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { context } from './adapters/lib/context'
import type { AdapterInterface } from './adapters/lib/defs'
import { NuqsTestingAdapter, type UrlUpdateEvent } from './adapters/testing'
import type { LimitUrlUpdates } from './defs'
import { debounce } from './lib/queues/rate-limiting'
import { resetQueues } from './lib/queues/reset'
import { emitter } from './lib/sync'
import { parseAsString } from './parsers'
import { useQueryStates } from './useQueryStates'

const click = (testId: string) =>
  page
    .getByTestId(testId)
    .element()
    .dispatchEvent(new MouseEvent('click', { bubbles: true }))

function ControlledAdapter({
  children,
  pathname,
  search
}: {
  children: ReactNode
  pathname: string | undefined
  search: string
}) {
  const adapter = useMemo<AdapterInterface>(
    () => ({
      pathname,
      searchParams: new URLSearchParams(search),
      updateUrl: () => {}
    }),
    [pathname, search]
  )
  return createElement(
    context.Provider,
    { value: { useAdapter: () => adapter } },
    children
  )
}

describe('useQueryStates: mutation qualification', () => {
  const originalUrl = location.href

  afterEach(async () => {
    await cleanup()
    resetQueues()
    history.replaceState(history.state, '', originalUrl)
  })

  it.each([
    {
      name: 'a pathname-aware adapter with a matching live search',
      pathnameAware: true
    },
    {
      name: 'a pathname-less adapter with a stale live search',
      pathnameAware: false
    }
  ])(
    'blocks abandoned-render recovery for $name',
    async ({ pathnameAware }) => {
      let didSuspend = false
      const hold = new Promise<never>(() => {})
      const commits: Array<string | null> = []

      function Probe() {
        const [{ value }] = useQueryStates({ value: parseAsString })
        useLayoutEffect(() => {
          commits.push(value)
        })
        return <output data-testid="value">{value}</output>
      }

      function Suspender({ search }: { search: string }) {
        if (search.includes('incoming')) {
          didSuspend = true
          throw hold
        }
        return null
      }

      function App() {
        const [search, setSearch] = useState('?value=old')
        const [pathname, setPathname] = useState<string | undefined>(
          pathnameAware ? '/page' : undefined
        )
        const [, setTick] = useState(0)
        return (
          <>
            <button
              data-testid="reconcile"
              onClick={() => {
                history.replaceState(history.state, '', '/page?value=incoming')
                startTransition(() => setSearch('?value=incoming'))
              }}
            />
            <button
              data-testid="interrupt"
              onClick={() => {
                if (pathnameAware) {
                  setPathname('/elsewhere')
                } else {
                  history.replaceState(
                    history.state,
                    '',
                    '/elsewhere?value=stale'
                  )
                  setTick(tick => tick + 1)
                }
              }}
            />
            <ControlledAdapter pathname={pathname} search={search}>
              <Probe />
              <Suspense fallback={null}>
                <Suspender search={search} />
              </Suspense>
            </ControlledAdapter>
          </>
        )
      }

      history.replaceState(history.state, '', '/page?value=old')
      await render(<App />)
      expect(commits).toEqual(['old'])

      click('reconcile')
      await expect.poll(() => didSuspend).toBe(true)

      flushSync(() => click('interrupt'))

      expect(commits).toEqual(['old', 'old'])
      expect(page.getByTestId('value').element().textContent).toBe('old')
    }
  )

  it('keeps optimistic transition state out of urgent rebases and same-value bailouts', async () => {
    let didSuspend = false
    const hold = new Promise<never>(() => {})
    const commits: Array<{ a: string | null; b: string | null }> = []

    function Suspender({ value }: { value: string | null }) {
      if (value === '2') {
        didSuspend = true
        throw hold
      }
      return null
    }

    function Probe() {
      const [state] = useQueryStates({
        a: parseAsString,
        b: parseAsString
      })
      useLayoutEffect(() => {
        commits.push(state)
      })
      return (
        <>
          <button
            data-testid="transition-a"
            onClick={() =>
              startTransition(() =>
                emitter.emit('a', { state: '2', query: '2' })
              )
            }
          />
          <button
            data-testid="same-b"
            onClick={() => emitter.emit('b', { state: '1', query: '1' })}
          />
          <button
            data-testid="change-b"
            onClick={() => emitter.emit('b', { state: '2', query: '2' })}
          />
          <output data-testid="state">{`${state.a},${state.b}`}</output>
          <Suspense fallback={null}>
            <Suspender value={state.a} />
          </Suspense>
        </>
      )
    }

    await render(
      <NuqsTestingAdapter searchParams="?a=1&b=1">
        <Probe />
      </NuqsTestingAdapter>
    )
    const initialState = commits.at(-1)
    expect(initialState).toEqual({ a: '1', b: '1' })

    click('transition-a')
    await expect.poll(() => didSuspend).toBe(true)

    flushSync(() => click('same-b'))
    expect(commits.at(-1)).toBe(initialState)

    flushSync(() => click('change-b'))
    expect(commits.at(-1)).toEqual({ a: '1', b: '2' })
    expect(commits.at(-1)).not.toBe(initialState)
    expect(page.getByTestId('state').element().textContent).toBe('1,2')
  })
})

describe('useQueryStates: options and parser caching', () => {
  afterEach(async () => {
    await cleanup()
    resetQueues()
  })

  async function renderSetter(
    keyMap: Parameters<typeof useQueryStates>[0],
    onUrlUpdate: (event: UrlUpdateEvent) => void
  ) {
    let set!: ReturnType<typeof useQueryStates>[1]
    function Probe() {
      ;[, set] = useQueryStates(keyMap)
      return null
    }
    await render(
      <NuqsTestingAdapter onUrlUpdate={onUrlUpdate}>
        <Probe />
      </NuqsTestingAdapter>
    )
    return set
  }

  it('defaults to shallow updates, and takes shallow and scroll from the parser', async () => {
    const events: UrlUpdateEvent[] = []
    const set = await renderSetter(
      {
        a: parseAsString,
        b: parseAsString.withOptions({ shallow: false, scroll: true })
      },
      event => events.push(event)
    )
    await set({ a: 'a' })
    expect(events.at(-1)?.options).toMatchObject({
      shallow: true,
      scroll: false
    })
    await set({ b: 'b' })
    expect(events.at(-1)?.options).toMatchObject({
      shallow: false,
      scroll: true
    })
  })

  it('resolves with the largest debounce, and uses the default debounce time', async () => {
    const events: UrlUpdateEvent[] = []
    const set = await renderSetter(
      {
        slow: parseAsString.withOptions({ limitUrlUpdates: debounce(200) }),
        fast: parseAsString.withOptions({ limitUrlUpdates: debounce(20) })
      },
      event => events.push(event)
    )
    const search = await set({ slow: 'slow', fast: 'fast' })
    expect(search.get('slow')).toBe('slow')
    events.length = 0
    // `timeMs` is required by the types, not from JavaScript callers.
    const defaultDebounce = { method: 'debounce' } as LimitUrlUpdates
    void set({ fast: 'default' }, { limitUrlUpdates: defaultDebounce })
    await new Promise(resolve => setTimeout(resolve, 10))
    expect(events).toEqual([])
    await expect.poll(() => events.length).toBe(1)
  })

  it.each([
    { name: 'gains', from: undefined, to: 'default', expected: 'default' },
    { name: 'loses', from: 'default', to: undefined, expected: 'null' }
  ])(
    'renders the new default value when a parser $name it',
    async ({ from, to, expected }) => {
      // An `eq` that matches anything: only defined values can be compared.
      const parser = { parse: (v: string) => v, eq: () => true }
      function Probe({ defaultValue }: { defaultValue?: string }) {
        const [{ value }] = useQueryStates({
          value: { ...parser, defaultValue }
        })
        return <p data-testid="value">{String(value)}</p>
      }
      const screen = await render(
        <NuqsTestingAdapter>
          <Probe defaultValue={from} />
        </NuqsTestingAdapter>
      )
      await screen.rerender(
        <NuqsTestingAdapter>
          <Probe defaultValue={to} />
        </NuqsTestingAdapter>
      )
      await expect
        .element(page.getByTestId('value'))
        .toHaveTextContent(expected)
    }
  )

  it('compares the default values of a parser without eq', async () => {
    function Probe() {
      // A new default value on each render, and no `eq` to compare them.
      const [{ value }] = useQueryStates({
        value: { parse: (v: string) => v, defaultValue: ['default'] }
      })
      return <p data-testid="value">{String(value)}</p>
    }
    const screen = await render(
      <NuqsTestingAdapter>
        <Probe />
      </NuqsTestingAdapter>
    )
    await screen.rerender(
      <NuqsTestingAdapter>
        <Probe />
      </NuqsTestingAdapter>
    )
    await expect.element(page.getByTestId('value')).toHaveTextContent('default')
  })
})
