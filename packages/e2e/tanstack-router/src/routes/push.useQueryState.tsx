import { createFileRoute } from '@tanstack/react-router'
import { PushUseQueryState } from 'e2e-shared/specs/push'

export const Route = createFileRoute('/push/useQueryState')({
  component: PushUseQueryState
})
