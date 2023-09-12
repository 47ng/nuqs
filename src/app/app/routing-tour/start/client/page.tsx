'use client'

import Link from 'next/link'

export default function ServerStartPage() {
  return (
    <ul>
      <li>
        <Link href="/app/routing-tour/a?from=start.client">a (server)</Link>
      </li>
      <li>
        <Link href="/app/routing-tour/b?from=start.client">b (server)</Link>
      </li>
      <li>
        <Link href="/app/routing-tour/c?from=start.client">c (client)</Link>
      </li>
      <li>
        <Link href="/app/routing-tour/d?from=start.client">d (client)</Link>
      </li>
    </ul>
  )
}
