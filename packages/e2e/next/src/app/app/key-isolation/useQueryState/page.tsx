import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { Suspense } from 'react'
import { KeyIsolationUseQueryState } from '../client'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <Suspense>
      <NuqsAdapter experimental_keyIsolation>
        <KeyIsolationUseQueryState />
      </NuqsAdapter>
    </Suspense>
  )
}
