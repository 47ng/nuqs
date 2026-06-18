import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { PopstateQueueResetClient } from 'e2e-shared/specs/popstate-queue-reset'

export const Route = createFileRoute('/popstate-queue-reset')({
  component: Page
})

function Page() {
  const navigate = useNavigate()
  return (
    <PopstateQueueResetClient
      onNavigateToOther={() => navigate({ to: '/popstate-queue-reset-other' })}
    />
  )
}
