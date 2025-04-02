import { createFileRoute } from '@tanstack/react-router'
import { ConditionalRenderingUseQueryStates } from 'e2e-shared/specs/conditional-rendering'

export const Route = createFileRoute('/conditional-rendering/useQueryStates')({
  component: ConditionalRenderingUseQueryStates
})
