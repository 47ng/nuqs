import { createFileRoute } from '@tanstack/react-router'
import { Repro1358RouteA } from 'e2e-shared/specs/repro-1358'

export const Route = createFileRoute('/repro-1358/a')({
  component: () => <Repro1358RouteA otherPageHref="/repro-1358/b" />
})
