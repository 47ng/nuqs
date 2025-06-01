import { FlushAfterNavigateUseQueryStatesStart } from 'e2e-shared/specs/flush-after-navigate'

export default function Page() {
  return (
    <FlushAfterNavigateUseQueryStatesStart path="/flush-after-navigate/useQueryStates" />
  )
}
