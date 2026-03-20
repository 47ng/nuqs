import { Repro1273StartPage } from 'e2e-shared/specs/repro-1273'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <Repro1273StartPage otherPagePath="/app/repro-1273/other" />
    </Suspense>
  )
}
