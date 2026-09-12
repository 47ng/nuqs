import React, { startTransition, Suspense, useEffect, useState } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from 'vitest-browser-react'
import { page } from 'vitest/browser'
import { NuqsAdapter } from './adapters/react'
import { throttle } from './lib/queues/rate-limiting'
import { resetQueues } from './lib/queues/reset'
import { parseAsString } from './parsers'
import { useQueryStates } from './useQueryStates'

const click = (testId: string) =>
  page
    .getByTestId(testId)
    .element()
    .dispatchEvent(new MouseEvent('click', { bubbles: true }))

describe('useQueryStates: discarded URL reconciliation', () => {
  const originalUrl = location.href

  afterEach(async () => {
    await cleanup()
    resetQueues()
    history.replaceState(history.state, '', originalUrl)
  })

  // Regression for https://github.com/47ng/nuqs/issues/1567
  it('preserves a URL-derived sibling when a write interrupts reconciliation', async () => {
    let release!: () => void
    let didSuspend = false
    let suspended = true
    const hold = new Promise<void>(resolve => {
      release = resolve
    }).then(() => {
      suspended = false
    })

    function Suspender({ tick }: { tick: number }) {
      if (tick % 2 === 1 && suspended) {
        didSuspend = true
        throw hold
      }
      return null
    }

    function Probe() {
      const [{ a, b }, setValues] = useQueryStates({
        a: parseAsString,
        b: parseAsString
      })
      const [tick, setTick] = useState(0)
      return (
        <>
          <button
            data-testid="transition"
            onClick={() => startTransition(() => setTick(t => t + 1))}
          />
          <button
            data-testid="write-a"
            onClick={() => void setValues({ a: '5' })}
          />
          <output data-testid="a">{a}</output>
          <output data-testid="b">{b}</output>
          <Suspense fallback={null}>
            <Suspender tick={tick} />
          </Suspense>
        </>
      )
    }

    const url = new URL(location.href)
    url.searchParams.set('a', '1')
    url.searchParams.set('b', '1')
    history.replaceState(history.state, '', url)
    await render(
      <NuqsAdapter>
        <Probe />
      </NuqsAdapter>
    )
    await expect.element(page.getByTestId('b')).toHaveTextContent('1')

    url.searchParams.set('b', '2')
    history.replaceState(history.state, '', url)
    click('transition')
    await expect.poll(() => didSuspend).toBe(true)
    click('write-a')
    await expect.element(page.getByTestId('a')).toHaveTextContent('5')
    await expect.element(page.getByTestId('b')).toHaveTextContent('2')
    release()

    await expect.element(page.getByTestId('a')).toHaveTextContent('5')
    await expect.element(page.getByTestId('b')).toHaveTextContent('2')
  })

  it('preserves a URL-derived sibling when the interrupt matches committed state', async () => {
    let release!: () => void
    let didSuspend = false
    let suspended = true
    const hold = new Promise<void>(resolve => {
      release = resolve
    }).then(() => {
      suspended = false
    })

    function Suspender({ tick }: { tick: number }) {
      if (tick % 2 === 1 && suspended) {
        didSuspend = true
        throw hold
      }
      return null
    }

    function Probe() {
      const [{ a, b }, setValues] = useQueryStates({
        a: parseAsString,
        b: parseAsString
      })
      const [tick, setTick] = useState(0)
      return (
        <>
          <button
            data-testid="transition"
            onClick={() => startTransition(() => setTick(t => t + 1))}
          />
          <button
            data-testid="write-a"
            onClick={() => void setValues({ a: '1' })}
          />
          <output data-testid="a">{a}</output>
          <output data-testid="b">{b}</output>
          <Suspense fallback={null}>
            <Suspender tick={tick} />
          </Suspense>
        </>
      )
    }

    const url = new URL(location.href)
    url.searchParams.set('a', '1')
    url.searchParams.set('b', '1')
    history.replaceState(history.state, '', url)
    await render(
      <NuqsAdapter>
        <Probe />
      </NuqsAdapter>
    )
    await expect.element(page.getByTestId('b')).toHaveTextContent('1')

    url.searchParams.set('a', '2')
    url.searchParams.set('b', '2')
    history.replaceState(history.state, '', url)
    click('transition')
    await expect.poll(() => didSuspend).toBe(true)
    click('write-a')

    await expect.element(page.getByTestId('a')).toHaveTextContent('1')
    await expect.element(page.getByTestId('b')).toHaveTextContent('2')
    release()
    await expect.element(page.getByTestId('b')).toHaveTextContent('2')
  })

  it('does not resurrect a cancelled transition before a derived write', async () => {
    let release!: () => void
    let didSuspend = false
    let didReconcile = false
    let suspended = true
    const hold = new Promise<void>(resolve => {
      release = resolve
    }).then(() => {
      suspended = false
    })

    function Suspender({ value }: { value: string | null }) {
      if (value === '2' && suspended) {
        didSuspend = true
        throw hold
      }
      return null
    }

    function Probe() {
      const [{ a, b, c }, setValues] = useQueryStates({
        a: parseAsString,
        b: parseAsString,
        c: parseAsString
      })
      useEffect(() => {
        void setValues({ c: b }).then(() => {
          if (b === '0') didReconcile = true
        })
      }, [b])
      return (
        <>
          <button
            data-testid="transition-a"
            onClick={() => startTransition(() => void setValues({ a: '2' }))}
          />
          <output data-testid="a">{a}</output>
          <output data-testid="b">{b}</output>
          <output data-testid="c">{c}</output>
          <Suspense fallback={null}>
            <Suspender value={a} />
          </Suspense>
        </>
      )
    }

    const url = new URL(location.href)
    url.searchParams.set('a', '1')
    url.searchParams.set('b', '1')
    history.replaceState(history.state, '', url)
    await render(
      <NuqsAdapter>
        <Probe />
      </NuqsAdapter>
    )
    await expect.element(page.getByTestId('c')).toHaveTextContent('1')

    click('transition-a')
    await expect.poll(() => didSuspend).toBe(true)

    const back = new URL(location.href)
    back.searchParams.set('a', '1')
    back.searchParams.set('b', '0')
    history.replaceState(history.state, '', back)
    window.dispatchEvent(new PopStateEvent('popstate'))
    await expect.poll(() => didReconcile).toBe(true)
    release()

    await expect.element(page.getByTestId('a')).toHaveTextContent('1')
    await expect.element(page.getByTestId('b')).toHaveTextContent('0')
    await expect.element(page.getByTestId('c')).toHaveTextContent('0')
    expect(
      Object.fromEntries(new URL(location.href).searchParams)
    ).toMatchObject({
      a: '1',
      b: '0',
      c: '0'
    })
  })
})

describe('useQueryStates: path-only navigation', () => {
  const originalUrl = location.href

  afterEach(async () => {
    await cleanup()
    resetQueues()
    history.replaceState(history.state, '', originalUrl)
  })

  it('adopts a sibling overlay write made after a path-only navigation', async () => {
    function Reader() {
      const [{ q }] = useQueryStates({ q: parseAsString, r: parseAsString })
      return <output data-testid="reader">{q}</output>
    }
    function Writer() {
      const [{ q }, setValues] = useQueryStates({
        q: parseAsString.withOptions({ limitUrlUpdates: throttle(Infinity) })
      })
      return (
        <>
          <button
            data-testid="write"
            onClick={() => void setValues({ q: '2' })}
          />
          <output data-testid="writer">{q}</output>
        </>
      )
    }

    history.replaceState(history.state, '', '/a?q=1')
    await render(
      <NuqsAdapter>
        <Reader />
        <Writer />
      </NuqsAdapter>
    )
    await expect.element(page.getByTestId('reader')).toHaveTextContent('1')

    history.replaceState(history.state, '', '/b?q=1')
    click('write')

    await expect.element(page.getByTestId('writer')).toHaveTextContent('2')
    await expect.element(page.getByTestId('reader')).toHaveTextContent('2')
  })
})
