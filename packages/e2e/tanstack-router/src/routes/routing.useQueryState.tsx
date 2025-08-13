import { createFileRoute } from '@tanstack/react-router'
import { RoutingUseQueryState } from 'e2e-shared/specs/routing'

export const Route = createFileRoute('/routing/useQueryState')({
  component: Page
})

function Page() {
  return <RoutingUseQueryState path="/routing/useQueryState" />
}
