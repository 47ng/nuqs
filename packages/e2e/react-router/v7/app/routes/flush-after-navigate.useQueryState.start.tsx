import { FlushAfterNavigateUseQueryStateStart } from 'e2e-shared/specs/flush-after-navigate'

export default function Page() {
  return (
    <FlushAfterNavigateUseQueryStateStart path="/flush-after-navigate/useQueryState" />
  )
}
