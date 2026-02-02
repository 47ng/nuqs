import { PopstateQueueResetClient } from 'e2e-shared/specs/popstate-queue-reset'
import { useRouter } from 'next/router'

export default function Page() {
  const router = useRouter()
  return (
    <PopstateQueueResetClient
      onNavigateToOther={() => router.push('/pages/popstate-queue-reset/other')}
    />
  )
}
