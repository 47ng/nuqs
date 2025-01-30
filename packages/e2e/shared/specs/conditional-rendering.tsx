'use client'

import { parseAsString, useQueryState, useQueryStates } from 'nuqs'
import { type FC, useState } from 'react'

function ConditionalRenderer({ Component }: { Component: FC }) {
  const [mounted, setMounted] = useState(false)
  return (
    <>
      <button id="mount" onClick={() => setMounted(true)}>
        Mount
      </button>
      <button id="unmount" onClick={() => setMounted(false)}>
        Unount
      </button>
      {mounted && <Component />}
    </>
  )
}

// --

function TestComponentUseQueryState() {
  const [state, setState] = useQueryState('test')
  return (
    <>
      <button id="set" onClick={() => setState('pass')}>
        Set
      </button>
      <pre id="state">{state}</pre>
    </>
  )
}

function TestComponentUseQueryStates() {
  const [{ state }, setState] = useQueryStates(
    {
      state: parseAsString
    },
    { urlKeys: { state: 'test' } }
  )
  return (
    <>
      <button id="set" onClick={() => setState({ state: 'pass' })}>
        Set
      </button>
      <pre id="state">{state}</pre>
    </>
  )
}

// --

export function ConditionalRenderingUseQueryState() {
  return <ConditionalRenderer Component={TestComponentUseQueryState} />
}

export function ConditionalRenderingUseQueryStates() {
  return <ConditionalRenderer Component={TestComponentUseQueryStates} />
}
