import { LinkingUseQueryStates } from 'e2e-shared/cypress/e2e/linking'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <LinkingUseQueryStates path="/app/linking/useQueryStates" />
    </Suspense>
  )
}
