import { FlushAfterNavigateUseQueryStatesStart } from 'e2e-shared/specs/flush-after-navigate'

export default function Page() {
  return <FlushAfterNavigateUseQueryStatesStart path="/dynamic/flush-after-navigate/useQueryStates" />
}

export const getConfig = async () => {
  return {
    render: 'dynamic'
  } as const
}
