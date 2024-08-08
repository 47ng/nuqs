'use client'

import { useQueryState } from 'nuqs'
import { Suspense, useCallback } from 'react'

export default function Page() {
  return (
    <Suspense>
      <DeferredForm />
      <InternalState />
    </Suspense>
  )
}

function DeferredForm() {
  const [a, setA] = useQueryState('a', {
    defaultValue: '',
    throttleMs: Infinity
  })
  const [b, setB] = useQueryState('b', {
    defaultValue: '',
    throttleMs: Infinity
  })

  const onSubmit = useCallback(() => {
    // Apply current values to the URL
    setA(passThru, { throttleMs: 0 })
    setB(passThru, { throttleMs: 0 })
  }, [])

  return (
    <>
      <input id="input-a" value={a} onChange={e => setA(e.target.value)} />
      <input id="input-b" value={b} onChange={e => setB(e.target.value)} />
      <button onClick={onSubmit}>Write to URL</button>
    </>
  )
}

function InternalState() {
  const [a] = useQueryState('a', { defaultValue: '' })
  const [b] = useQueryState('b', { defaultValue: '' })
  return (
    <>
      <p>This is the internal state:</p>
      <ul>
        <li id="state-a">{a}</li>
        <li id="state-b">{b}</li>
      </ul>
    </>
  )
}

// --

function passThru<T>(x: T): T {
  return x
}
