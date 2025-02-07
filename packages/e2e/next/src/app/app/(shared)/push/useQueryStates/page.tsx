import { PushUseQueryStates } from 'e2e-shared/specs/push'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <PushUseQueryStates />
    </Suspense>
  )
}
