'use client'

import { useQueryState } from 'nuqs'

export function HashPreservation() {
  const [, setState] = useQueryState('test')
  return (
    <>
      <button id="set" onClick={() => setState('pass')}>
        Set
      </button>
      <button id="clear" onClick={() => setState(null)}>
        Clear
      </button>
    </>
  )
}
