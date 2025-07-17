import { createFileRoute } from '@tanstack/react-router'
import { ReferentialStabilityUseQueryStates } from 'e2e-shared/specs/referential-stability'

export const Route = createFileRoute('/referential-stability/useQueryStates')({
  component: ReferentialStabilityUseQueryStates
})
