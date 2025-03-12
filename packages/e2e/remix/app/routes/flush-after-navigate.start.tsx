import { FlushAfterNavigateStart } from 'e2e-shared/specs/flush-after-navigate'

export default function Page() {
  return <FlushAfterNavigateStart path="/flush-after-navigate" />
}
