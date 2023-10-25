'use client'

import { parseAsInteger, useQueryState } from 'next-usequerystate'

export function ReleaseClient() {
  const [counter, setCounter] = useQueryState(
    'release',
    parseAsInteger.withDefault(0)
  )
  const [common, setCommon] = useQueryState(
    'common',
    parseAsInteger.withDefault(0)
  )
  return (
    <>
      <h2>Release</h2>
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
      <p>Release: {counter}</p>
      <p>Common: {common}</p>
    </>
  )
}
