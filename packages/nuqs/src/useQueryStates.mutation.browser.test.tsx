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
import { throttle } from './lib/queues/rate-limiting'
import { resetQueues } from './lib/queues/reset'
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
      const [state, setState] = useQueryStates({
        a: parseAsString.withOptions({ limitUrlUpdates: throttle(Infinity) }),
        b: parseAsString.withOptions({ limitUrlUpdates: throttle(Infinity) })
      })
      useLayoutEffect(() => {
        commits.push(state)
      })
      return (
        <>
          <button
            data-testid="transition-a"
            onClick={() => startTransition(() => void setState({ a: '2' }))}
          />
          <button
            data-testid="same-b"
            onClick={() => void setState({ b: '1' })}
          />
          <button
            data-testid="change-b"
            onClick={() => void setState({ b: '2' })}
          />
          <output data-testid="state">{`${state.a},${state.b}`}</output>
          <Suspense fallback={null}>
            <Suspender value={state.a} />
          </Suspense>
        </>
      )
    }

    await render(
      <ControlledAdapter pathname={undefined} search="?a=1&b=1">
        <Probe />
      </ControlledAdapter>
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
