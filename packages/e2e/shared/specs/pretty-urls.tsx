'use client'

import { useQueryState } from 'nuqs'

export function PrettyUrls() {
  const [state, setState] = useQueryState('test')
  return (
    <>
      <button onClick={() => setState('-._~!$()*,;=:@/?[]{}\\|^')}>Test</button>
      <pre id="state">{state}</pre>
    </>
  )
}
