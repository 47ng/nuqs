import { createFileRoute } from '@tanstack/react-router'
import { LinkingUseQueryState } from 'e2e-shared/specs/linking'

export const Route = createFileRoute('/linking/useQueryState')({
  component: Page
})

export default function Page() {
  return <LinkingUseQueryState path="/linking/useQueryState" />
}
