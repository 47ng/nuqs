'use client'

import { parseAsString, useQueryState, useQueryStates } from 'nuqs'
import { Display } from '../components/display'
import { optionsSearchParams } from '../lib/options'

export function ShallowUseQueryState() {
  const [{ shallow, history }] = useQueryStates(optionsSearchParams)
  const [state, setState] = useQueryState('test', { shallow, history })
  return (
    <>
      <button onClick={() => setState('pass')}>Test</button>
      <Display environment="client" state={state} />
    </>
  )
}

export function ShallowUseQueryStates() {
  const [{ shallow, history }] = useQueryStates(optionsSearchParams)
  const [{ state }, setSearchParams] = useQueryStates(
    {
      state: parseAsString.withOptions({ shallow, history })
    },
    {
      urlKeys: {
        state: 'test'
      }
    }
  )
  return (
    <>
      <button onClick={() => setSearchParams({ state: 'pass' })}>Test</button>
      <Display environment="client" state={state} />
    </>
  )
}
