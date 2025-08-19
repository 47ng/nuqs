import { Repro982 } from 'e2e-shared/specs/repro-982'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <Repro982 />
    </Suspense>
  )
}
