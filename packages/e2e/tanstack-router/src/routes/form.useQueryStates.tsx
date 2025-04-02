import { createFileRoute } from '@tanstack/react-router'
import { TestFormUseQueryStates } from 'e2e-shared/specs/form'

export const Route = createFileRoute('/form/useQueryStates')({
  component: TestFormUseQueryStates
})
