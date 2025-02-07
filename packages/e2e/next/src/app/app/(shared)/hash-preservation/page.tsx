import { HashPreservation } from 'e2e-shared/specs/hash-preservation'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <HashPreservation />
    </Suspense>
  )
}
