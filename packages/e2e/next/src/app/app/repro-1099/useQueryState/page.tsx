import { Repro1099UseQueryState } from 'e2e-shared/specs/repro-1099'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <Repro1099UseQueryState />
    </Suspense>
  )
}
