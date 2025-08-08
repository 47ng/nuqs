import { createFileRoute } from '@tanstack/react-router'
import { ShallowUseQueryState } from 'e2e-shared/specs/shallow'

export const Route = createFileRoute('/shallow/useQueryState')({
  component: ShallowUseQueryState
})
