import { PopstateQueueResetClient } from 'e2e-shared/specs/popstate-queue-reset'
import { useNavigate } from '@remix-run/react'

export default function Page() {
  const navigate = useNavigate()
  return (
    <PopstateQueueResetClient
      onNavigateToOther={() => navigate('/popstate-queue-reset-other')}
    />
  )
}
