'use client'

import Link from 'next/link'
import { useQueryState } from 'nuqs'
import { useEffect } from 'react'

const url = () => `${location.pathname}${location.search}`

// A filter bar in the shared layout: mounted on every route, reading the same
// keys the destination pages initialise during render.
export function FilterBar() {
  const [mode] = useQueryState('mode')
  const [filter] = useQueryState('filter')
  useEffect(() => {
    console.log(
      `bar: mode=${mode ?? 'null'} filter=${filter ?? 'null'} | url=${url()}`
    )
  })
  return (
    <nav>
      <p id="bar">
        mode: {mode ?? 'null'} · filter: {filter ?? 'null'}
      </p>
      <Link href="/app/uncommitted-route/rsc">to rsc</Link>
      <Link href="/app/uncommitted-route/promise">to promise</Link>
      <Link href="/app/uncommitted-route/cpu">to cpu</Link>
      <Link href="/app/uncommitted-route/a?other=1">to a</Link>
    </nav>
  )
}
