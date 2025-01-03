import { ReferentialStabilityUseQueryStates } from 'e2e-shared/specs/referential-stability'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <ReferentialStabilityUseQueryStates />
    </Suspense>
  )
}
