import Link from 'next/link'

const demos = [
  // App router demos
  'app/basic-counter',
  'app/batching',
  'app/builder-pattern',
  'app/compound-parsers',
  'app/crosslink',
  'app/custom-parser',
  'app/hex-colors',
  'app/parsers',
  'app/pretty-urls',
  'app/server-side-parsing',
  'app/subscribeToQueryUpdates',
  'app/throttling',
  'app/repro-359',
  'app/repro-376',
  'app/repro-430',
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
      <footer>
        Made by <a href="https://francoisbest.com">François Best</a> • Follow my
        work on <a href="https://github.com/franky47">GitHub</a> and{' '}
        <a href="https://mamot.fr/@Franky47">Mastodon</a> •{' '}
        <a href="mailto:freelance@francoisbest.com">Hire me!</a>
      </footer>
    </main>
  )
}
