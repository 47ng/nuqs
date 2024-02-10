'use client'

import { useQueryState } from 'nuqs'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <Client />
    </Suspense>
  )
}

function Client() {
  const [, setA] = useQueryState('a')
  const [, setB] = useQueryState('b', {
    defaultValue: '',
    clearOnDefault: true
  })
  return (
    <>
      <button
        onClick={() => {
          setA('')
          setB('')
        }}
      >
        Clear
      </button>
    </>
  )
}
