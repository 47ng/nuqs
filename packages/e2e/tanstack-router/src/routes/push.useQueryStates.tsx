import { createFileRoute } from '@tanstack/react-router'
import { PushUseQueryStates } from 'e2e-shared/specs/push'

export const Route = createFileRoute('/push/useQueryStates')({
  component: PushUseQueryStates
})
