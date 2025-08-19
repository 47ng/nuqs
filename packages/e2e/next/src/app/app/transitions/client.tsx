'use client'

import { parseAsInteger, useQueryState } from 'nuqs'
import { useTransition } from 'react'

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
      <p id="server-status">{isLoading ? 'loading' : 'idle'}</p>
      <button onClick={() => setCounter(counter + 1)}>{counter}</button>
    </>
  )
}
