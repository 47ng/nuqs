import { createFileRoute } from '@tanstack/react-router'
import { Repro1293PageA } from 'e2e-shared/specs/repro-1293'

export const Route = createFileRoute('/repro-1293/a')({
  component: RouteComponent
})

function RouteComponent() {
  return <Repro1293PageA linkHref="/repro-1293/b" />
}
