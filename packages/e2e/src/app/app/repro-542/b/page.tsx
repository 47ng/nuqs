'use client'

import { parseAsString, useQueryState, useQueryStates } from 'nuqs'
import React, { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <Client />
    </Suspense>
  )
}

function Client() {
  console.log(
    'rendering page b, url: %s',
    typeof location !== 'undefined' ? location.href : 'ssr'
  )
  const ref = React.useRef<any>(null)
  const [q] = useQueryState('q')
  const [{ r }] = useQueryStates({ r: parseAsString })
  if (ref.current === null) {
    ref.current = { q, r }
  }
  return (
    <>
      <div id="q">{q}</div>
      <div id="r">{r}</div>
      <div id="initial">{JSON.stringify(ref.current)}</div>
    </>
  )
}
