'use client'

import { parseAsString, useQueryState, useQueryStates } from 'nuqs'

export function PushUseQueryState() {
  const [state, setState] = useQueryState('test', { history: 'push' })
  return (
    <>
      <button onClick={() => setState('pass')}>Test</button>
      <pre id="state">{state}</pre>
    </>
  )
}

export function PushUseQueryStates() {
  const [{ test: state }, setSearchParams] = useQueryStates(
    {
      test: parseAsString
    },
    { history: 'push' }
  )
  return (
    <>
      <button onClick={() => setSearchParams({ test: 'pass' })}>Test</button>
      <pre id="state">{state}</pre>
    </>
  )
}
