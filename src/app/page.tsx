import Link from 'next/link'

const demos = [
  'builder-pattern',
  'subscribeToQueryUpdates',
  'batching',
  'server-side-parsing'
]

export default function IndexPage() {
  return (
    <main>
      <h1>next-usequerystate playground</h1>
      <h2>Demos</h2>
      <ul>
        {demos.map(path => (
          <li key={path}>
            <Link href={`/demos/${path}`}>{path}</Link>
          </li>
        ))}
      </ul>
      <p>
        <em>All demos use the app router.</em>
      </p>
      <hr />
      <h2>End-to-end integration tests</h2>
      <p>⚠️ Don't change these routes without updating integration tests.</p>
      <h3>App router</h3>
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
      <h3>Pages router</h3>
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
