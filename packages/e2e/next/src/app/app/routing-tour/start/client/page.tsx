'use client'

import Link from 'next/link'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <ClientStartPage />
    </Suspense>
  )
}

function ClientStartPage() {
  return (
    <ul>
      <li>
        <Link href="/app/routing-tour/a?from=start.client">
          a (server, prefetch)
        </Link>
      </li>
      <li>
        <Link href="/app/routing-tour/b?from=start.client" prefetch={false}>
          b (server, no prefetch)
        </Link>
      </li>
      <li>
        <Link href="/app/routing-tour/c?from=start.client">
          c (client, prefetch)
        </Link>
      </li>
      <li>
        <Link href="/app/routing-tour/d?from=start.client" prefetch={false}>
          d (client, no prefetch)
        </Link>
      </li>
    </ul>
  )
}
