'use client'

import { parseAsInteger, useQueryState } from 'nuqs'
import { useTransition } from 'react'
import { HydrationMarker } from '../../../components/hydration-marker'

export function Client() {
  const [isLoading, startTransition] = useTransition()
  const [counter, setCounter] = useQueryState(
    'counter',
    parseAsInteger.withDefault(0).withOptions({
      shallow: false,
      startTransition
    })
  )
  return (
    <>
      <HydrationMarker />
      <p id="server-status">{isLoading ? 'loading' : 'idle'}</p>
      <button onClick={() => setCounter(counter + 1)}>{counter}</button>
    </>
  )
}
