import { QueueLifecycle } from 'e2e-shared/specs/queue-lifecycle'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <QueueLifecycle />
    </Suspense>
  )
}
