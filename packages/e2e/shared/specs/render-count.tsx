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
  if (hook === 'useQueryState') {
    const [, setState] = useQueryState('test', {
      shallow,
      history,
      startTransition
    })
    return <button onClick={() => setState('pass')}>Test</button>
  }
  if (hook === 'useQueryStates') {
    const [, setState] = useQueryStates({
      test: parseAsString.withOptions({ shallow, history, startTransition })
    })
    return <button onClick={() => setState({ test: 'pass' })}>Test</button>
  }
  return null
}
