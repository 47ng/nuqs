'use client'

import { useQueryState } from 'next-usequerystate'

const testValues = [
  '/home/user/.ssh/id.pub',
  '192.168.0.0',
  '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
  'C:\\> cd Program Files',
  'proto://user:password@domain.tld:port/path?query=value&foo=bar#hash',
  'Non\nprintable\tchars',
  "Hey! What's that sound?",
  '(<{[-_-]}>)',
  JSON.stringify({ hello: 'world' }),
  '👋🌍'
]

export default function PrettyURLsDemoPage() {
  const [q, setQ] = useQueryState('q')
  return (
    <>
      <h1>Pretty URLs</h1>
      <p>Value: {q}</p>
      <ul>
        {testValues.map(value => (
          <li key={value}>
            <button onClick={() => setQ(value)}>{value}</button>
          </li>
        ))}
        <li>
          <button onClick={() => setQ(decodeURIComponent(location.toString()))}>
            Recurse
          </button>
        </li>
      </ul>
      <p>
        <a href="https://github.com/47ng/next-usequerystate/blob/next/src/app/demos/pretty-urls/page.tsx">
          Source on GitHub
        </a>
      </p>
    </>
  )
}
