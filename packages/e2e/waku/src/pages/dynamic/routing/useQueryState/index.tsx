import { RoutingUseQueryState } from 'e2e-shared/specs/routing'

export default function Page() {
  return <RoutingUseQueryState path="/dynamic/routing/useQueryState" />
}

export const getConfig = async () => {
  return {
    render: 'dynamic'
  } as const
}
