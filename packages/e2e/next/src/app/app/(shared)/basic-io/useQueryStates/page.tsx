import { UseQueryStatesBasicIO } from 'e2e-shared/specs/basic-io'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <UseQueryStatesBasicIO />
    </Suspense>
  )
}
