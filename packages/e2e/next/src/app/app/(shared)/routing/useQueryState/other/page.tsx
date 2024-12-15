import { RoutingUseQueryState } from 'e2e-shared/specs/routing'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <RoutingUseQueryState path="/app/routing/useQueryState" />
    </Suspense>
  )
}
