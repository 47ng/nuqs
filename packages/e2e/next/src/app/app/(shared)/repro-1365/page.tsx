import { Repro1365 } from 'e2e-shared/specs/repro-1365'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <Repro1365 />
    </Suspense>
  )
}
