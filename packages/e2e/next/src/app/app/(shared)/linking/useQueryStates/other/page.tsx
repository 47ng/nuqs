import { LinkingUseQueryStates } from 'e2e-shared/specs/linking'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <LinkingUseQueryStates path="/app/linking/useQueryStates" />
    </Suspense>
  )
}
