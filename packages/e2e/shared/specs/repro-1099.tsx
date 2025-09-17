'use client'

import { parseAsString, useQueryState, useQueryStates } from 'nuqs'
import { useEffect, useState } from 'react'
import { NullDetector } from '../components/null-detector'
import { useOptions } from '../lib/options'

export function Repro1099UseQueryState() {
  const { shallow, history } = useOptions()
  const [state, setState] = useQueryState('test', { shallow, history })
  const [isNullDetectorEnabled, setIsNullDetectorEnabled] = useState(false)
  useStateUpdateInEffect(state)
  return (
    <>
      <button
        onClick={() => {
          setIsNullDetectorEnabled(true)
          setState('pass')
        }}
      >
        Test
      </button>
      <NullDetector state={state} enabled={isNullDetectorEnabled} />
    </>
  )
}

export function Repro1099UseQueryStates() {
  const { shallow, history } = useOptions()
  const [{ state }, setSearchParams] = useQueryStates(
    {
      state: parseAsString
    },
    {
      shallow,
      history,
      urlKeys: {
        state: 'test'
      }
    }
  )
  const [isNullDetectorEnabled, setIsNullDetectorEnabled] = useState(false)
  useStateUpdateInEffect(state)
  return (
    <>
      <button
        onClick={() => {
          setIsNullDetectorEnabled(true)
          setSearchParams({ state: 'pass' })
        }}
      >
        Test
      </button>
      <NullDetector state={state} enabled={isNullDetectorEnabled} />
    </>
  )
}

function useStateUpdateInEffect(trigger: unknown) {
  const [, setCount] = useState(0)
  useEffect(() => {
    if (!trigger) {
      return
    }
    console.log('[repro-1099] trigger other state update')
    setCount(x => x + 1)
  }, [trigger])
}
