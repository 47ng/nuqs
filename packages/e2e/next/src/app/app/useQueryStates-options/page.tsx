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
  const [values, setValues] = useQueryStates(
    {
      a: parseAsString.withDefault(''),
      b: parseAsString.withDefault('').withOptions({
        clearOnDefault: false
      })
    },
    {
      clearOnDefault: true
    }
  )
  return (
    <>
      <button id="1" onClick={() => setValues({ a: '', b: '' })}>
        1
      </button>
      <button
        id="2"
        onClick={() => setValues({ a: '', b: '' }, { clearOnDefault: false })}
      >
        2
      </button>
      <button
        id="3"
        onClick={() => setValues({ a: '', b: '' }, { clearOnDefault: true })}
      >
        3
      </button>
    </>
  )
}
