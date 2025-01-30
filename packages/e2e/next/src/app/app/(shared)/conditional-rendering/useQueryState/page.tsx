import { ConditionalRenderingUseQueryState } from 'e2e-shared/specs/conditional-rendering'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <ConditionalRenderingUseQueryState />
    </Suspense>
  )
}
