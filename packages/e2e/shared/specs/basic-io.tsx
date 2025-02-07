'use client'

import { parseAsString, useQueryState, useQueryStates } from 'nuqs'

export function UseQueryStateBasicIO() {
  const [state, setState] = useQueryState('test')
  return (
    <>
      <button id="set-pass" onClick={() => setState('pass')}>
        Test
      </button>
      <button id="clear" onClick={() => setState(null)}>
        Clear
      </button>
      <pre id="state">{state}</pre>
    </>
  )
}

export function UseQueryStatesBasicIO() {
  const [{ test }, setSearchParams] = useQueryStates({
    test: parseAsString
  })
  return (
    <>
      <button id="set-pass" onClick={() => setSearchParams({ test: 'pass' })}>
        Test
      </button>
      <button id="clear" onClick={() => setSearchParams(null)}>
        Clear
      </button>
      <pre id="state">{test}</pre>
    </>
  )
}
