import { createFileRoute } from '@tanstack/react-router'
import { Json } from 'e2e-shared/specs/json'

export const Route = createFileRoute('/json')({
  component: Json
})
