import { createFileRoute } from '@tanstack/react-router'
import { HashPreservation } from 'e2e-shared/specs/hash-preservation'

export const Route = createFileRoute('/hash-preservation')({
  component: HashPreservation
})
