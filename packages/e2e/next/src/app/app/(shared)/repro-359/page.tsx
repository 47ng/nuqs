import { Repro359 } from 'e2e-shared/specs/repro-359'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <Repro359 />
    </Suspense>
  )
}
