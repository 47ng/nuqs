'use client'

import { useSearchParams } from 'next/navigation'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <Client />
    </Suspense>
  )
}

function Client() {
  const [q, setQ] = useQueryState('q', { defaultValue: '' })
  const [, setPush] = useQueryState(
    'push',
    parseAsBoolean.withDefault(false).withOptions({ history: 'push' })
  )
  const searchParams = useSearchParams()
  return (
    <div>
      <input type="text" value={q} onChange={e => setQ(e.target.value)} />
      <pre id="searchParams">{searchParams?.toString() ?? 'null'}</pre>
      <button onClick={() => setPush(true)}>Push</button>
    </div>
  )
}
