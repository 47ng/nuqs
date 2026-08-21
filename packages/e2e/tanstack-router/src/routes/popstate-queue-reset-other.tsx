import { createFileRoute } from '@tanstack/react-router'
import { PopstateQueueResetOther } from 'e2e-shared/specs/popstate-queue-reset'

export const Route = createFileRoute('/popstate-queue-reset-other')({
  component: PopstateQueueResetOther
})
