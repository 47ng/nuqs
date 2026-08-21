import { FlushAfterNavigateUseQueryStateStart } from 'e2e-shared/specs/flush-after-navigate'

export default function Page() {
  return <FlushAfterNavigateUseQueryStateStart path="/dynamic/flush-after-navigate/useQueryState" />
}

export const getConfig = async () => {
  return {
    render: 'dynamic'
  } as const
}
