'use client'

import { parseAsString, useQueryState, useQueryStates } from 'nuqs'
import { NullDetector } from '../components/null-detector'

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
      <NullDetector state={state} />
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
      <NullDetector state={test} />
    </>
  )
}
