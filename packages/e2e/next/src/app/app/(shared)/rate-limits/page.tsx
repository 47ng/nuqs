import { RateLimits } from 'e2e-shared/specs/rate-limits'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <RateLimits />
    </Suspense>
  )
}
