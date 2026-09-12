import { PushUseQueryState } from 'e2e-shared/specs/push'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <PushUseQueryState />
    </Suspense>
  )
}
