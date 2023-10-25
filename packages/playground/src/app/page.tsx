import Link from 'next/link'

const demos = [
  // App router demos
  'app/basic-counter',
  'app/batching',
  'app/builder-pattern',
  'app/compound-parsers',
  'app/crosslink',
  'app/custom-parser',
  'app/debug-release-interop',
  'app/hex-colors',
  'app/pretty-urls',
  'app/server-side-parsing',
  'app/subscribeToQueryUpdates',
  'app/repro-359',
  'app/repro-376',
  // Pages router demos
  'pages/server-side-counter'
]

export default function IndexPage() {
  return (
    <main>
      <h1>Playground</h1>
      <h2>Demos</h2>
      <h3>App router</h3>
      <ul>
        {demos
          .filter(p => p.startsWith('app/'))
          .map(path => (
            <li key={path}>
              <Link href={`/demos/${path.slice(4)}`}>{path.slice(4)}</Link>
            </li>
          ))}
      </ul>
      <h3>Pages router</h3>
      <ul>
        {demos
          .filter(p => p.startsWith('pages/'))
          .map(path => (
            <li key={path}>
              <Link href={`/demos/pages/${path.slice(6)}`}>
                {path.slice(6)}
              </Link>
            </li>
          ))}
      </ul>
      <hr />
      <h2>End-to-end integration tests</h2>
      <p>⚠️ Don't change these routes without updating integration tests.</p>
      <h3>App router</h3>
      <ul>
        <li>
          <Link href="/e2e/app/useQueryState">[static] useQueryState</Link>
        </li>
        <li>
          <Link href="/e2e/app/useQueryState/dynamic/foo">
            [dynamic] useQueryState
          </Link>
        </li>
        <li>
          <Link href="/e2e/app/useQueryStates">[static] useQueryStates</Link>
        </li>
        <li>
          <Link href="/e2e/app/useQueryStates/dynamic/foo">
            [dynamic] useQueryStates
          </Link>
        </li>
        <li>
          <Link href="/e2e/app/routing-tour/start/server">
            Routing tour starting with server index
          </Link>
        </li>
        <li>
          <Link href="/e2e/app/routing-tour/start/client">
            Routing tour starting with client index
          </Link>
        </li>
      </ul>
      <h3>Pages router</h3>
      <ul>
        <li>
          <Link href="/e2e/pages/useQueryState">[static] useQueryState</Link>
        </li>
        <li>
          <Link href="/e2e/pages/useQueryState/dynamic/foo">
            [dynamic] useQueryState
          </Link>
        </li>
        <li>
          <Link href="/e2e/pages/useQueryStates">[static] useQueryStates</Link>
        </li>
        <li>
          <Link href="/e2e/pages/useQueryStates/dynamic/foo">
            [dynamic] useQueryStates
          </Link>
        </li>
      </ul>
      <hr />
      <footer>
        Made by <a href="https://francoisbest.com">François Best</a> • Follow my
        work on <a href="https://github.com/franky47">GitHub</a> and{' '}
        <a href="https://mamot.fr/@Franky47">Mastodon</a> •{' '}
        <a href="mailto:freelance@francoisbest.com">Hire me!</a>
      </footer>
    </main>
  )
}
