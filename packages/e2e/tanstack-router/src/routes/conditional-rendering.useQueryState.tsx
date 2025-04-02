import { createFileRoute } from '@tanstack/react-router'
import { ConditionalRenderingUseQueryState } from 'e2e-shared/specs/conditional-rendering'

export const Route = createFileRoute('/conditional-rendering/useQueryState')({
  component: ConditionalRenderingUseQueryState
})
