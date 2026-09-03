import { LinkingUseQueryStates } from 'e2e-shared/specs/linking'

export default function Page() {
  return <LinkingUseQueryStates path="/dynamic/linking/useQueryStates" />
}

export const getConfig = async () => {
  return {
    render: 'dynamic'
  } as const
}
