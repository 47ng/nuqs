import { FlushAfterNavigateEnd } from 'e2e-shared/specs/flush-after-navigate'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <FlushAfterNavigateEnd />
    </Suspense>
  )
}
