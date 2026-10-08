import { Repro1612 } from 'e2e-shared/specs/repro-1612'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <Repro1612 />
    </Suspense>
  )
}
