import { createFileRoute } from '@tanstack/react-router'
import { KeyIsolationUseQueryState } from 'e2e-shared/specs/key-isolation'

export const Route = createFileRoute('/key-isolation/useQueryState')({
  component: KeyIsolationUseQueryState
})
