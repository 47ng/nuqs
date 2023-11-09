import Link from 'next/link'

export default function ServerStartPage() {
  return (
    <ul>
      <li>
        <Link href="/app/routing-tour/a?from=start.server">
          a (server, prefetch)
        </Link>
      </li>
      <li>
        <Link href="/app/routing-tour/b?from=start.server" prefetch={false}>
          b (server, no prefetch)
        </Link>
      </li>
      <li>
        <Link href="/app/routing-tour/c?from=start.server">
          c (client, prefetch)
        </Link>
      </li>
      <li>
        <Link href="/app/routing-tour/d?from=start.server" prefetch={false}>
          d (client, no prefetch)
        </Link>
      </li>
    </ul>
  )
}
