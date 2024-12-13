import { UseQueryStatesBasicIO } from 'e2e-shared/cypress/e2e/basic-io'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <UseQueryStatesBasicIO />
    </Suspense>
  )
}
