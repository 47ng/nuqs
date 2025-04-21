import { Repro702 } from 'e2e-shared/specs/repro-702'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <Repro702 />
    </Suspense>
  )
}
