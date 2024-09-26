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
  const [state, setState] = useQueryState('state', {
    defaultValue: '',
    clearOnDefault: true
  })
  return (
    <>
      <input value={state} onChange={e => setState(e.target.value)} />
    </>
  )
}
