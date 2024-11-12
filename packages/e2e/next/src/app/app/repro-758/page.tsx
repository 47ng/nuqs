'use client'

import { parseAsString, useQueryStates } from 'nuqs'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <Client />
    </Suspense>
  )
}

function Client() {
  const [{ query }, setSearchParams] = useQueryStates(
    {
      query: parseAsString
    },
    {
      history: 'push',
      urlKeys: {
        query: 'q'
      }
    }
  )
  return (
    <>
      <button onClick={() => setSearchParams({ query: 'test' })}>
        Set query
      </button>
      <p id="state">{query}</p>
    </>
  )
}
