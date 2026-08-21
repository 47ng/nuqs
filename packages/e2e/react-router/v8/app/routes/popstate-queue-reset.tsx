import { PopstateQueueResetClient } from 'e2e-shared/specs/popstate-queue-reset'
import { useNavigate } from 'react-router'

export default function Page() {
  const navigate = useNavigate()
  return (
    <PopstateQueueResetClient
      onNavigateToOther={() => navigate('/popstate-queue-reset/other')}
    />
  )
}
