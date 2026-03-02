import { Repro1293PageA } from 'e2e-shared/specs/repro-1293'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <Repro1293PageA linkHref="/app/repro-1293/b" />
    </Suspense>
  )
}
