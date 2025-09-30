import { createFileRoute } from '@tanstack/react-router'
import { Repro1099UseQueryState } from 'e2e-shared/specs/repro-1099'

export const Route = createFileRoute('/repro-1099/useQueryState')({
  component: Repro1099UseQueryState
})
