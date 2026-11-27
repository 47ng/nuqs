import React, {
  Activity,
  Component,
  Suspense,
  use,
  useEffect,
  useLayoutEffect,
  useRef
} from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { unstable_createAdapterProvider } from './adapters/custom'
import { debounce } from './lib/queues/rate-limiting'
import { resetQueues } from './lib/queues/reset'
import { renderQueryString } from './lib/url-encoding'
import { useQueryState } from './useQueryState'

// A hook rendering for a route that has not committed yet must not update the
// URL, nor the other hooks, until it mounts: that render may never commit (#1358).
const writes: string[] = []
const Adapter = unstable_createAdapterProvider(() => ({
  searchParams: new URLSearchParams(location.search),
  updateUrl(search) {
    writes.push(search.toString())
    history.replaceState(null, '', renderQueryString(search))
  },
  autoResetQueueOnUpdate: false
}))

const neverResolves = new Promise<never>(() => {})
const resolutions: string[] = []

function Observer() {
  const [mode] = useQueryState('mode')
  return <output data-testid="observer">{mode ?? 'null'}</output>
}

// Writes a default during render, like #1358 (and only once, like a
// `useRef`-guarded initialisation).
function Destination({ suspend }: { suspend: boolean }) {
  const [, setMode] = useQueryState('mode')
  const [initialised] = React.useState(() => {
    void setMode('default').then(search => resolutions.push(search.toString()))
    return true
  })
  if (suspend) {
    use(neverResolves)
  }
  return <p data-testid="destination">{String(initialised)}</p>
}

const urlMode = () => new URLSearchParams(location.search).get('mode')

describe('useQueryStates: setters called before the route commits', () => {
  const originalUrl = location.href

  afterEach(async () => {
    await cleanup()
    resetQueues()
    writes.length = 0
    resolutions.length = 0
    history.replaceState(history.state, '', originalUrl)
  })

  it('does not update the URL nor the other hooks while the route has not committed', async () => {
    await render(
      <Adapter>
        <Observer />
        <Suspense>
          <Destination suspend />
        </Suspense>
      </Adapter>
    )
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(writes).toEqual([])
    expect(urlMode()).toBeNull()
    await expect.element(page.getByTestId('observer')).toHaveTextContent('null')
    // The setter Promises only resolve once their update is written.
    expect(resolutions).toEqual([])
  })

  it('applies the setter calls once the route mounts', async () => {
    await render(
      <Adapter>
        <Observer />
        <Destination suspend={false} />
      </Adapter>
    )
    await expect.poll(urlMode).toBe('default')
    await expect
      .element(page.getByTestId('observer'))
      .toHaveTextContent('default')
    expect(writes).toHaveLength(1)
    expect(new URLSearchParams(writes[0]).get('mode')).toBe('default')
  })

  it('keeps the call order between a render-time setter and a later effect', async () => {
    function Child() {
      const [, setMode] = useQueryState('mode')
      useEffect(() => {
        void setMode('child')
      }, [])
      return null
    }
    function Parent() {
      const [, setMode] = useQueryState('mode')
      const initialised = useRef(false)
      if (!initialised.current) {
        initialised.current = true
        void setMode('parent')
      }
      return <Child />
    }
    await render(
      <Adapter>
        <Parent />
      </Adapter>
    )
    await expect.poll(() => writes.length).toBeGreaterThan(0)
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(urlMode()).toBe('child')
  })

  it('shows the value of a render-time setter on the first paint', async () => {
    let firstPaint: string | undefined
    const readFirstPaint = () => {
      const text = document.querySelector(
        '[data-testid="observer"]'
      )?.textContent
      if (text === undefined || text === null) {
        requestAnimationFrame(readFirstPaint)
      } else {
        firstPaint = text
      }
    }
    requestAnimationFrame(readFirstPaint)
    function Init() {
      const [mode, setMode] = useQueryState('mode')
      if (!mode) {
        void setMode('default')
      }
      return null
    }
    await render(
      <Adapter>
        <Init />
        <Observer />
      </Adapter>
    )
    await expect.poll(() => firstPaint).toBeDefined()
    expect(firstPaint).toBe('default')
  })

  for (const [name, useSetterEffect] of [
    ['a layout effect', useLayoutEffect],
    ['an effect of a child', useEffect]
  ] as const) {
    it(`resolves the setter Promise once its update is written (from ${name})`, async () => {
      let promise: Promise<URLSearchParams> | undefined
      function Child({
        setMode
      }: {
        setMode: (v: string) => Promise<URLSearchParams>
      }) {
        useSetterEffect(() => {
          promise = setMode('set')
        }, [])
        return null
      }
      function Parent() {
        const [, setMode] = useQueryState('mode', {
          limitUrlUpdates: debounce(50)
        })
        return <Child setMode={value => setMode(value)} />
      }
      await render(
        <Adapter>
          <Parent />
        </Adapter>
      )
      await expect.poll(() => promise).toBeDefined()
      const search = await promise!
      expect(search.get('mode')).toBe('set')
      expect(urlMode()).toBe('set')
    })
  }

  it('resolves a render-time setter Promise once its update is written', async () => {
    let resolved: string | null | undefined
    function Init() {
      const [mode, setMode] = useQueryState('mode')
      const initialised = useRef(false)
      if (!mode && !initialised.current) {
        initialised.current = true
        void setMode('default', { limitUrlUpdates: debounce(50) }).then(
          search => {
            resolved = search.get('mode')
          }
        )
      }
      return null
    }
    await render(
      <Adapter>
        <Init />
      </Adapter>
    )
    await expect.poll(() => resolved).toBeDefined()
    expect(resolved).toBe('default')
    expect(urlMode()).toBe('default')
  })

  it('keeps the call order with a layout effect of a component without a hook', async () => {
    function Child({ setMode }: { setMode: (value: string) => unknown }) {
      useLayoutEffect(() => {
        void setMode('child')
      }, [])
      return null
    }
    function Parent() {
      const [, setMode] = useQueryState('mode')
      const initialised = useRef(false)
      if (!initialised.current) {
        initialised.current = true
        void setMode('parent')
      }
      return <Child setMode={setMode} />
    }
    await render(
      <Adapter>
        <Parent />
      </Adapter>
    )
    await expect.poll(() => writes.length).toBeGreaterThan(0)
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(urlMode()).toBe('child')
  })

  it('keeps the setter calls of a hidden Activity until it is revealed', async () => {
    function Hidden() {
      const [, setMode] = useQueryState('mode')
      const initialised = useRef(false)
      if (!initialised.current) {
        initialised.current = true
        void setMode('hidden')
      }
      return null
    }
    function Unrelated() {
      useQueryState('other')
      return null
    }
    const tree = (
      mode: 'hidden' | 'visible' | 'removed',
      unrelated: boolean
    ) => (
      <Adapter>
        {mode !== 'removed' && (
          <Activity mode={mode}>
            <Hidden />
          </Activity>
        )}
        {unrelated && <Unrelated />}
      </Adapter>
    )
    const screen = await render(tree('hidden', false))
    await new Promise(resolve => setTimeout(resolve, 100))
    // An unrelated hook mounting must not replay them.
    await screen.rerender(tree('hidden', true))
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(writes).toEqual([])
    await screen.rerender(tree('visible', true))
    await expect.poll(urlMode).toBe('hidden')
  })

  it('drops the setter calls of a hidden Activity removed before it is revealed', async () => {
    function Hidden() {
      const [, setMode] = useQueryState('mode')
      const initialised = useRef(false)
      if (!initialised.current) {
        initialised.current = true
        void setMode('hidden')
      }
      return null
    }
    const screen = await render(
      <Adapter>
        <Activity mode="hidden">
          <Hidden />
        </Activity>
      </Adapter>
    )
    await new Promise(resolve => setTimeout(resolve, 100))
    await screen.rerender(<Adapter>{null}</Adapter>)
    await render(
      <Adapter>
        <Observer />
      </Adapter>
    )
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(writes).toEqual([])
  })

  it('throws a render-time updater error in the calling component only', async () => {
    const errors: string[] = []
    class Boundary extends Component<
      { name: string; children: React.ReactNode },
      { failed: boolean }
    > {
      state = { failed: false }
      static getDerivedStateFromError() {
        return { failed: true }
      }
      componentDidCatch(error: Error) {
        errors.push(`${this.props.name}: ${error.message}`)
      }
      render() {
        return this.state.failed ? null : this.props.children
      }
    }
    function Bad() {
      const [mode, setMode] = useQueryState('mode')
      if (!mode) {
        void setMode(() => {
          throw new Error('boom')
        })
      }
      return null
    }
    function Good() {
      const [filter, setFilter] = useQueryState('filter')
      if (!filter) {
        void setFilter('good')
      }
      return null
    }
    await render(
      <Adapter>
        <Boundary name="bad">
          <Bad />
        </Boundary>
        <Boundary name="good">
          <Good />
        </Boundary>
      </Adapter>
    )
    await expect
      .poll(() => new URLSearchParams(location.search).get('filter'))
      .toBe('good')
    expect(errors).toEqual(['bad: boom'])
  })

  it('does not replay over a newer layout effect call of an earlier sibling', async () => {
    function Earlier() {
      const [, setMode] = useQueryState('mode')
      useLayoutEffect(() => {
        void setMode('earlier')
      }, [])
      return null
    }
    function Later() {
      const [, setMode] = useQueryState('mode')
      const initialised = useRef(false)
      if (!initialised.current) {
        initialised.current = true
        void setMode('later')
      }
      return null
    }
    await render(
      <Adapter>
        <Earlier />
        <Later />
      </Adapter>
    )
    await expect.poll(() => writes.length).toBeGreaterThan(0)
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(urlMode()).toBe('earlier')
  })

  it('keeps the call order between render-time calls of a parent and its child', async () => {
    function Child() {
      const [, setMode] = useQueryState('mode')
      const initialised = useRef(false)
      if (!initialised.current) {
        initialised.current = true
        void setMode('child')
      }
      return null
    }
    function Parent() {
      const [, setMode] = useQueryState('mode')
      const initialised = useRef(false)
      if (!initialised.current) {
        initialised.current = true
        void setMode('parent')
      }
      return <Child />
    }
    await render(
      <Adapter>
        <Parent />
      </Adapter>
    )
    await expect.poll(() => writes.length).toBeGreaterThan(0)
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(urlMode()).toBe('child')
  })

  it('does not replay the calls of a hidden Activity over newer ones on reveal', async () => {
    function Hidden() {
      const [, setMode] = useQueryState('mode')
      const initialised = useRef(false)
      if (!initialised.current) {
        initialised.current = true
        void setMode('hidden')
      }
      return null
    }
    function Visible({ write }: { write: boolean }) {
      const [, setMode] = useQueryState('mode')
      useEffect(() => {
        if (write) {
          void setMode('visible')
        }
      }, [write])
      return null
    }
    const tree = (mode: 'hidden' | 'visible', write: boolean) => (
      <Adapter>
        <Activity mode={mode}>
          <Hidden />
        </Activity>
        <Visible write={write} />
      </Adapter>
    )
    const screen = await render(tree('hidden', false))
    await new Promise(resolve => setTimeout(resolve, 100))
    await screen.rerender(tree('hidden', true))
    await expect.poll(urlMode).toBe('visible')
    await screen.rerender(tree('visible', true))
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(urlMode()).toBe('visible')
  })

  it('does not overwrite newer values with a render-time default on reveal', async () => {
    // Not guarded by a ref: also called again when revealed.
    function Hidden() {
      const [mode, setMode] = useQueryState('mode')
      if (!mode) {
        void setMode('hidden')
      }
      return null
    }
    function Visible({ write }: { write: boolean }) {
      const [, setMode] = useQueryState('mode')
      useEffect(() => {
        if (write) {
          void setMode('visible')
        }
      }, [write])
      return null
    }
    const tree = (mode: 'hidden' | 'visible', write: boolean) => (
      <Adapter>
        <Activity mode={mode}>
          <Hidden />
        </Activity>
        <Visible write={write} />
      </Adapter>
    )
    const screen = await render(tree('hidden', false))
    await new Promise(resolve => setTimeout(resolve, 100))
    await screen.rerender(tree('hidden', true))
    await expect.poll(urlMode).toBe('visible')
    await screen.rerender(tree('visible', true))
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(urlMode()).toBe('visible')
  })
})
