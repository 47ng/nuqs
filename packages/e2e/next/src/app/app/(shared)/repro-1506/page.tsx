import { Repro1506 } from 'e2e-shared/specs/repro-1506'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <Repro1506 />
    </Suspense>
  )
}
