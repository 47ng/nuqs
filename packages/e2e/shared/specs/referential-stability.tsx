'use client'

import { parseAsString, useQueryState, useQueryStates } from 'nuqs'
import { useRef } from 'react'

export function ReferentialStabilityUseQueryState() {
  const [, setState] = useQueryState('test')
  const setterRef = useRef(setState)
  const hasChanged = setterRef.current !== setState
  return (
    <>
      <button onClick={() => setState('test')}>Test</button>
      <div id="state">{hasChanged ? 'fail' : 'pass'}</div>
    </>
  )
}

export function ReferentialStabilityUseQueryStates() {
  const [, setState] = useQueryStates({
    test: parseAsString
  })
  const setterRef = useRef(setState)
  const hasChanged = setterRef.current !== setState
  return (
    <>
      <button onClick={() => setState({ test: 'test' })}>Test</button>
      <div id="state">{hasChanged ? 'fail' : 'pass'}</div>
    </>
  )
}
