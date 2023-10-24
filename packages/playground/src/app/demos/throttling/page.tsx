'use client'

import { parseAsInteger, useQueryState } from 'src/nuqs'

export default function ThottlingDemoPage() {
  const [a, setA] = useQueryState('a', parseAsInteger.withDefault(0))
  const [b, setB] = useQueryState('b', parseAsInteger.withDefault(0))

  return (
    <>
      <h1>Throttled counters</h1>
      <p>Note: URL state updated are intentionally slowed down</p>
      <nav style={{ display: 'flex', gap: '4px' }}>
        <button
          style={{ padding: '2px 12px' }}
          onClick={() => {
            console.debug('decrement')
            setA(x => x - 1, { throttleMs: 1000 })
            setB(x => x - 1, { throttleMs: 2000 })
          }}
        >
          -
        </button>
        <button
          style={{ padding: '2px 12px' }}
          onClick={() => {
            console.debug('increment')
            setA(x => x + 1, { throttleMs: 2000 })
            setB(x => x + 1, { throttleMs: 1000 })
          }}
        >
          +
        </button>
        <button
          style={{ padding: '2px 6px' }}
          onClick={() => {
            console.debug('clear')
            setB(null)
            setA(null, { throttleMs: 1000 })
          }}
        >
          Reset
        </button>
      </nav>
      <p>A: {a}</p>
      <p>B: {b}</p>
      <p>
        <a href="https://github.com/47ng/next-usequerystate/blob/next/src/app/demos/thottling/page.tsx">
          Source on GitHub
        </a>
      </p>
    </>
  )
}
