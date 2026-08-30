import { createFileRoute } from '@tanstack/react-router'
import { LanePriority } from 'e2e-shared/specs/lane-priority'

export const Route = createFileRoute('/lane-priority')({
  component: LanePriority
})
