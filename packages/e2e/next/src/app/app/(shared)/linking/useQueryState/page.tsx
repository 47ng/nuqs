import { LinkingUseQueryState } from 'e2e-shared/cypress/e2e/linking'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <LinkingUseQueryState path="/app/linking/useQueryState" />
    </Suspense>
  )
}
