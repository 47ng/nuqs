'use client'

import { PopstateQueueResetClient } from 'e2e-shared/specs/popstate-queue-reset'
import { useRouter } from 'next/navigation'
import { Suspense } from 'react'

function PopstateQueueResetWrapper() {
  const router = useRouter()
  return (
    <PopstateQueueResetClient
      onNavigateToOther={() => router.push('/app/popstate-queue-reset/other')}
    />
  )
}

export default function Page() {
  return (
    <Suspense>
      <PopstateQueueResetWrapper />
    </Suspense>
  )
}
