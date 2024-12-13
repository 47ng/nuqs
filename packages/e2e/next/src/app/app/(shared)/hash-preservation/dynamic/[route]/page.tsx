import { HashPreservation } from 'e2e-shared/cypress/e2e/hash-preservation'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <HashPreservation />
    </Suspense>
  )
}
