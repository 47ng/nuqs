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
  const [, setValues] = useQueryStates({
    a: parseAsString.withDefault(''),
    b: parseAsString.withDefault('')
  })
  return (
    <>
      <button onClick={() => setValues(null)}>Clear</button>
    </>
  )
}
