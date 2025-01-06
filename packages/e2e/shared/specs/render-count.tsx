'use client'

import { parseAsString, useQueryState, useQueryStates } from 'nuqs'
import { useTransition } from 'react'

type RenderCountProps = {
  hook: 'useQueryState' | 'useQueryStates'
  shallow: boolean
  history: 'push' | 'replace'
  startTransition: boolean
}

export function RenderCount({
  hook,
  shallow,
  history,
  startTransition: enableStartTransition
}: RenderCountProps) {
  console.log('render')
  const startTransition = enableStartTransition ? useTransition()[1] : undefined
  let runTest = () => {}
  let state = null
  if (hook === 'useQueryState') {
    const [testState, setState] = useQueryState('test', {
      shallow,
      history,
      startTransition
    })
    runTest = () => setState('pass')
    state = testState
  }
  if (hook === 'useQueryStates') {
    const [{ test }, setState] = useQueryStates({
      test: parseAsString.withOptions({ shallow, history, startTransition })
    })
    runTest = () => setState({ test: 'pass' })
    state = test
  }
  return (
    <>
      <button onClick={runTest}>Test</button>
      <pre id="state">{state}</pre>
    </>
  )
}
