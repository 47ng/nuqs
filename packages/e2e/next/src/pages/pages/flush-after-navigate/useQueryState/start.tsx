import { FlushAfterNavigateUseQueryStateStart } from 'e2e-shared/specs/flush-after-navigate'

export default function Page() {
  return (
    <FlushAfterNavigateUseQueryStateStart path="/pages/flush-after-navigate/useQueryState" />
  )
}
