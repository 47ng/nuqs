'use client'

import { PopstateQueueResetClient } from 'e2e-shared/specs/popstate-queue-reset'
import { useRouter } from 'waku'

export function PopstateQueueReset() {
  const router = useRouter()
  return (
    <PopstateQueueResetClient
      onNavigateToOther={() => router.push('/popstate-queue-reset-other')}
    />
  )
}
