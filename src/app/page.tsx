import Link from 'next/link'

export default function IndexPage() {
  return (
    <main>
      <h2>App router</h2>
      <ul>
        <li>
          <Link href="/app/useQueryState">[static] useQueryState</Link>
        </li>
        <li>
          <Link href="/app/useQueryState/dynamic/foo">
            [dynamic] useQueryState
          </Link>
        </li>
        <li>
          <Link href="/app/useQueryStates">[static] useQueryStates</Link>
        </li>
        <li>
          <Link href="/app/useQueryStates/dynamic/foo">
            [dynamic] useQueryStates
          </Link>
        </li>
      </ul>
      <h2>Pages router</h2>
      <ul>
        <li>
          <Link href="/pages/useQueryState">[static] useQueryState</Link>
        </li>
        <li>
          <Link href="/pages/useQueryState/dynamic/foo">
            [dynamic] useQueryState
          </Link>
        </li>
        <li>
          <Link href="/pages/useQueryStates">[static] useQueryStates</Link>
        </li>
        <li>
          <Link href="/pages/useQueryStates/dynamic/foo">
            [dynamic] useQueryStates
          </Link>
        </li>
      </ul>
    </main>
  )
}
