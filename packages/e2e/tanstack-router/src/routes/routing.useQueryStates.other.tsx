import { createFileRoute } from '@tanstack/react-router'
import { RoutingUseQueryStates } from 'e2e-shared/specs/routing'

export const Route = createFileRoute('/routing/useQueryStates/other')({
  component: Page
})

function Page() {
  return <RoutingUseQueryStates path="/routing/useQueryStates" />
}
