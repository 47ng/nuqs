import { FlushAfterNavigateUseQueryStateStart } from 'e2e-shared/specs/flush-after-navigate'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <FlushAfterNavigateUseQueryStateStart path="/app/flush-after-navigate/useQueryState" />
    </Suspense>
  )
}
