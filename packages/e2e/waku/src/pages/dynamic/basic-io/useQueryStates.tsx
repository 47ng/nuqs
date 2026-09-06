import { UseQueryStatesBasicIO } from 'e2e-shared/specs/basic-io'

export default UseQueryStatesBasicIO

export const getConfig = async () => {
  return {
    render: 'dynamic'
  } as const
}
