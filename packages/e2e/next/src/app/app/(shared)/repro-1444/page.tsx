import { Repro1444 } from 'e2e-shared/specs/repro-1444'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <Repro1444 />
    </Suspense>
  )
}
