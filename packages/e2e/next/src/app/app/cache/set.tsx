'use client'

import { useQueryStates } from 'nuqs'
import { parsers } from './searchParams'

export function Set() {
  const [{ bool, num, str, def, nope }, set] = useQueryStates(parsers, {
    shallow: false
  })
  return (
    <>
      <h2>Set</h2>
      <button onClick={() => set({ str: 'from-set', num: 42, bool: true })}>
        Set
      </button>
      <p style={{ display: 'flex', gap: '1rem' }}>
        <span id="set-str">{str}</span>
        <span id="set-num">{num}</span>
        <span id="set-bool">{String(bool)}</span>
        <span id="set-def">{def}</span>
        <span id="set-nope">{String(nope)}</span>
      </p>
    </>
  )
}
