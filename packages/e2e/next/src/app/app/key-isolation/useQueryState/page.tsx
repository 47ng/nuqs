import { Suspense } from 'react'
import { KeyIsolationUseQueryState } from '../client'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <Suspense>
      <KeyIsolationUseQueryState />
    </Suspense>
  )
}
