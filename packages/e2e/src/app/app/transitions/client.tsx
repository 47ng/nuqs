'use client'

import { parseAsInteger, useQueryState } from 'nuqs'
import React from 'react'
import { HydrationMarker } from '../../../components/hydration-marker'

export function Client() {
  const [isLoading, startTransition] = React.useTransition()
  const [counter, setCounter] = useQueryState(
    'counter',
    parseAsInteger.withDefault(0).withOptions({ startTransition })
  )
  return (
    <>
      <HydrationMarker />
      <p id="server-status">{isLoading ? 'loading' : 'idle'}</p>
      <button onClick={() => setCounter(counter + 1)}>{counter}</button>
    </>
  )
}
