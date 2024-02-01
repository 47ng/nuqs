'use client'

import { useSearchParams } from 'next/navigation'
import { useQueryState } from 'nuqs'
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
  const searchParams = useSearchParams()
  return (
    <div>
      <input type="text" value={q} onChange={e => setQ(e.target.value)} />
      <p id="query">{q}</p>
      <pre id="searchParams">{searchParams?.toString() ?? 'null'}</pre>
    </div>
  )
}
