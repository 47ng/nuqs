'use client'

import { useQueryState } from 'next-usequerystate'

export default function ReproPage() {
  const [searchQueryUrl, setSearchQueryUrl] = useQueryState('search', {
    defaultValue: '',
    scroll: true,
    history: 'push'
  })

  return (
    <>
      <h1>Basic counter</h1>
      <p>
        <em>State is stored in the URL query string</em>
      </p>
      <div style={{ height: '120vh' }} />
      <nav style={{ display: 'flex', gap: '4px' }}>
        <button
          style={{ padding: '2px 12px' }}
          onClick={() => setSearchQueryUrl('https://example.com')}
        >
          example.com
        </button>
        <button
          style={{ padding: '2px 12px' }}
          onClick={() => setSearchQueryUrl('https://francoisbest.com')}
        >
          francoisbest.com
        </button>
        <button
          style={{ padding: '2px 6px' }}
          onClick={() => setSearchQueryUrl(null)}
        >
          Reset
        </button>
      </nav>
      <p>Query: {searchQueryUrl}</p>
      <p>
        <a href="https://github.com/47ng/next-usequerystate/tree/next/packages/docs/src/app/(pages)/playground/repro-376/page.tsx">
          Source on GitHub
        </a>
      </p>
    </>
  )
}
