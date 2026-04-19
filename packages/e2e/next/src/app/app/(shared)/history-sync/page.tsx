import { HistorySync } from 'e2e-shared/specs/history-sync'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <HistorySync />
    </Suspense>
  )
}
