import { Repro1293PageB } from 'e2e-shared/specs/repro-1293'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <Repro1293PageB />
    </Suspense>
  )
}
