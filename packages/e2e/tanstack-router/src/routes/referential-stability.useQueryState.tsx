import { createFileRoute } from '@tanstack/react-router'
import { ReferentialStabilityUseQueryState } from 'e2e-shared/specs/referential-stability'

export const Route = createFileRoute('/referential-stability/useQueryState')({
  component: ReferentialStabilityUseQueryState
})
