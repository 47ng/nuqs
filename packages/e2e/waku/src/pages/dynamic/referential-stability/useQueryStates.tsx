import { ReferentialStabilityUseQueryStates } from 'e2e-shared/specs/referential-stability'

export default ReferentialStabilityUseQueryStates

export const getConfig = async () => {
  return {
    render: 'dynamic'
  } as const
}
