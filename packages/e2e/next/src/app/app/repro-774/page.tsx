'use client'

import Link from 'next/link'
import { parseAsString, useQueryStates } from 'nuqs'
import { Suspense } from 'react'

export default function Home() {
  return (
    <>
      <nav>
        <Link id="link" href="/app/repro-774">
          Reset
        </Link>
      </nav>
      <Suspense>
        <Client />
      </Suspense>
    </>
  )
}

const searchParams = {
  a: parseAsString.withDefault(''),
  b: parseAsString.withDefault('')
}

function Client() {
  const [{ a, b }, setSearchParams] = useQueryStates(searchParams)
  return (
    <>
      <button onClick={() => setSearchParams({ a: 'a' })} id="trigger-a">
        Set A
      </button>
      <button onClick={() => setSearchParams({ b: 'b' })} id="trigger-b">
        Set B
      </button>
      <span id="value-a">{a}</span>
      <span id="value-b">{b}</span>
    </>
  )
}
