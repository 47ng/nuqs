import { RoutingUseQueryStates } from 'e2e-shared/specs/routing'

export default function Page() {
  return <RoutingUseQueryStates path="/dynamic/routing/useQueryStates" />
}

export const getConfig = async () => {
  return {
    render: 'dynamic'
  } as const
}
