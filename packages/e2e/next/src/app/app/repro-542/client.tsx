'use client'

import Link from 'next/link'
import { parseAsString, useQueryState, useQueryStates } from 'nuqs'
import React from 'react'

type ClientProps = {
  page: 'a' | 'b'
  linkTo: 'a' | 'b'
}

type Ref = {
  q: string | null
  r: string | null
}

export function Client({ page, linkTo }: ClientProps) {
  console.log(
    'rendering page %s, url: %s',
    page,
    typeof location !== 'undefined' ? location.href : 'ssr'
  )
  const [q] = useQueryState('q')
  const [{ r }] = useQueryStates({ r: parseAsString })
  const initial = React.useRef<Ref | null>(null)
  if (initial.current === null) {
    initial.current = { q, r }
  }
  return (
    <>
      <div id="q">{q}</div>
      <div id="r">{r}</div>
      <div id="initial">{JSON.stringify(initial.current)}</div>
      <Link href={`/app/repro-542/${linkTo}`}>
        Go to page {page.toUpperCase()}
      </Link>
    </>
  )
}
