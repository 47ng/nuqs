import { createFileRoute } from '@tanstack/react-router'
import { LifeAndDeath } from 'e2e-shared/specs/life-and-death'

export const Route = createFileRoute('/life-and-death')({
  component: LifeAndDeath
})
