import { createFileRoute } from '@tanstack/react-router'
import { ShallowUseQueryStates } from 'e2e-shared/specs/shallow'

export const Route = createFileRoute('/shallow/useQueryStates')({
  component: ShallowUseQueryStates
})
