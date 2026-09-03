import { Suspense } from 'react'
import { KeyIsolationUseQueryStates } from '../client'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <Suspense>
      <KeyIsolationUseQueryStates />
    </Suspense>
  )
}
