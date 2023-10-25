'use client'

import { parseAsInteger, useQueryState } from 'next-usequerystate/debug'

export function DebugClient() {
  const [counter, setCounter] = useQueryState(
    'debug',
    parseAsInteger.withDefault(0)
  )
  const [common, setCommon] = useQueryState(
    'common',
    parseAsInteger.withDefault(0)
  )
  return (
    <>
      <h2>Debug</h2>
      <nav style={{ display: 'flex', gap: '4px' }}>
        <button
          style={{ padding: '2px 12px' }}
          onClick={() => {
            setCounter(x => x - 1)
            setCommon(x => x - 1)
          }}
        >
          -
        </button>
        <button
          style={{ padding: '2px 12px' }}
          onClick={() => {
            setCounter(x => x + 1)
            setCommon(x => x + 1)
          }}
        >
          +
        </button>
        <button
          style={{ padding: '2px 6px' }}
          onClick={() => {
            setCounter(null)
            setCommon(null)
          }}
        >
          Reset
        </button>
      </nav>
      <p>Debug: {counter}</p>
      <p>Common: {common}</p>
    </>
  )
}
