import { LinkingUseQueryState } from 'e2e-shared/specs/linking'

export default function Page() {
  return <LinkingUseQueryState path="/dynamic/linking/useQueryState" />
}

export const getConfig = async () => {
  return {
    render: 'dynamic'
  } as const
}
