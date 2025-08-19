import { TestFormUseQueryState } from 'e2e-shared/specs/form'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <TestFormUseQueryState />
    </Suspense>
  )
}
