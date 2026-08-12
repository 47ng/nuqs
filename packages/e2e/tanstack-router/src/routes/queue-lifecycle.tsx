import { createFileRoute } from '@tanstack/react-router'
import { QueueLifecycle } from 'e2e-shared/specs/queue-lifecycle'

export const Route = createFileRoute('/queue-lifecycle')({
  component: QueueLifecycle
})
