import { Repro1099UseQueryStates } from 'e2e-shared/specs/repro-1099'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <Repro1099UseQueryStates />
    </Suspense>
  )
}
