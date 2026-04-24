import { createFileRoute } from '@tanstack/react-router'
import { Repro1358RouteB } from 'e2e-shared/specs/repro-1358'

export const Route = createFileRoute('/repro-1358/b')({
  component: () => <Repro1358RouteB otherPageHref="/repro-1358/a" />
})
