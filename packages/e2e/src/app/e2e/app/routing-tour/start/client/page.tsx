'use client'

import Link from 'next/link'

export default function ServerStartPage() {
  return (
    <ul>
      <li>
        <Link href="/e2e/app/routing-tour/a?from=start.client">
          a (server, prefetch)
        </Link>
      </li>
      <li>
        <Link href="/e2e/app/routing-tour/b?from=start.client" prefetch={false}>
          b (server, no prefetch)
        </Link>
      </li>
      <li>
        <Link href="/e2e/app/routing-tour/c?from=start.client">
          c (client, prefetch)
        </Link>
      </li>
      <li>
        <Link href="/e2e/app/routing-tour/d?from=start.client" prefetch={false}>
          d (client, no prefetch)
        </Link>
      </li>
    </ul>
  )
}
