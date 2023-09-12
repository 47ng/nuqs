import Link from 'next/link'

export default function ServerStartPage() {
  return (
    <ul>
      <li>
        <Link href="/app/routing-tour/a?from=start.server">a (server)</Link>
      </li>
      <li>
        <Link href="/app/routing-tour/b?from=start.server">b (server)</Link>
      </li>
      <li>
        <Link href="/app/routing-tour/c?from=start.server">c (client)</Link>
      </li>
      <li>
        <Link href="/app/routing-tour/d?from=start.server">d (client)</Link>
      </li>
    </ul>
  )
}
