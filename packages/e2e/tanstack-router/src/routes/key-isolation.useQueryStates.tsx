import { createFileRoute } from '@tanstack/react-router'
import { KeyIsolationUseQueryStates } from 'e2e-shared/specs/key-isolation'

export const Route = createFileRoute('/key-isolation/useQueryStates')({
  component: KeyIsolationUseQueryStates
})
