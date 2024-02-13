'use client'

import { useQueryState } from 'nuqs'
import { Suspense } from 'react'

export default function Page() {
  return (
    <main>
      <a id="start" href="#section">
        Apply fragment
      </a>
      <Suspense>
        <Client />
      </Suspense>
    </main>
  )
}

function Client() {
  const [, set] = useQueryState('q')
  return <button onClick={() => set('test')}>Set query</button>
}
