import { Repro1273OtherPage } from 'e2e-shared/specs/repro-1273'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <Repro1273OtherPage />
    </Suspense>
  )
}
