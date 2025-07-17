import { createFileRoute } from '@tanstack/react-router'
import { TestFormUseQueryState } from 'e2e-shared/specs/form'

export const Route = createFileRoute('/form/useQueryState')({
  component: TestFormUseQueryState
})
