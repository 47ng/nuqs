'use client'

import Link from 'next/link'
import { parseAsInteger, useQueryStates } from 'nuqs'
import { useEffect } from 'react'

const params = { q: parseAsInteger.withDefault(0) }

// Rendered from the shared layout, so the SAME hook instance is kept alive
// across the /a <-> /b navigations (a layout does not remount between its
// children). That persistence is the point: the hook observes a route change
// while keeping its refs, which is where the staleness regression lived.
export function SharedFilter() {
  const [{ q }] = useQueryStates(params)
  useEffect(() => {
    // Logged from an effect (commit-time) so the test asserts on what the app
    // actually consumes, ignoring render attempts React discards before paint.
    console.log(`commit: ${q}`)
  })
  return (
    <div>
      <code id="filter">q: {q}</code>
      <nav>
        <Link href="/app/shared-layout-sync/a?q=1">A1</Link>
        <Link href="/app/shared-layout-sync/b?q=1">B1</Link>
        <Link href="/app/shared-layout-sync/b?q=2">B2</Link>
      </nav>
    </div>
  )
}
