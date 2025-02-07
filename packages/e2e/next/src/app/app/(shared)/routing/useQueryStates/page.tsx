import { RoutingUseQueryStates } from 'e2e-shared/specs/routing'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <RoutingUseQueryStates path="/app/routing/useQueryStates" />
    </Suspense>
  )
}
