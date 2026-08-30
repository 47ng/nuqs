import { LanePriority } from 'e2e-shared/specs/lane-priority'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <LanePriority />
    </Suspense>
  )
}
