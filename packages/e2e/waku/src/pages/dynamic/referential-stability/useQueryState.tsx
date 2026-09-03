import { ReferentialStabilityUseQueryState } from 'e2e-shared/specs/referential-stability'

export default ReferentialStabilityUseQueryState

export const getConfig = async () => {
  return {
    render: 'dynamic'
  } as const
}
