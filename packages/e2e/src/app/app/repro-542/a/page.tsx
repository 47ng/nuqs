'use client'

import Link from 'next/link'
import { parseAsString, useQueryState, useQueryStates } from 'nuqs'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <Client />
    </Suspense>
  )
}

function Client() {
  console.log(
    'rendering page a, url: %s',
    typeof location !== 'undefined' ? location.href : 'ssr'
  )
  const [q] = useQueryState('q')
  const [{ r }] = useQueryStates({ r: parseAsString })
  return (
    <>
      <div id="q">{q}</div>
      <div id="r">{r}</div>
      <Link href="/app/repro-542/b">Go to page B</Link>
    </>
  )
}
