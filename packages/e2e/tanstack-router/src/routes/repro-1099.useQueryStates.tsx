import { createFileRoute } from '@tanstack/react-router'
import { Repro1099UseQueryStates } from 'e2e-shared/specs/repro-1099'

export const Route = createFileRoute('/repro-1099/useQueryStates')({
  component: Repro1099UseQueryStates
})
