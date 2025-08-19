import { createFileRoute } from '@tanstack/react-router'
import { LinkingUseQueryStates } from 'e2e-shared/specs/linking'

export const Route = createFileRoute('/linking/useQueryStates')({
  component: Page
})

export default function Page() {
  return <LinkingUseQueryStates path="/linking/useQueryStates" />
}
