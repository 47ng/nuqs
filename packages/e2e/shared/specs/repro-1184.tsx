'use client'

import { useQueryStates } from 'nuqs'
import { useEffect, useTransition } from 'react'
import { repro1184SearchParams } from './repro-1184.defs'

type Props = {
  serverCounter: number
}

export function Repro1184({ serverCounter }: Props) {
  const [isLoading, startTransition] = useTransition()
  const [{ counter }, setSearchParams] = useQueryStates(repro1184SearchParams, {
    shallow: false,
    startTransition
  })
  // Logging from an effect (not the render body) only captures committed
  // renders, so the test observes the isPending flag as committed, ignoring
  // render attempts React discards.
  useEffect(() => {
    console.log(
      `repro-1184 loading:${isLoading} client:${counter} server:${serverCounter}`
    )
  })
  return (
    <>
      <button onClick={() => setSearchParams({ counter: counter + 1 })}>
        Increment
      </button>
      <pre id="client-counter">{counter}</pre>
      <pre id="server-counter">{serverCounter}</pre>
      <pre id="loading">{isLoading ? 'loading' : 'idle'}</pre>
    </>
  )
}
