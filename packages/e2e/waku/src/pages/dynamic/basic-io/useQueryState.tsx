import { UseQueryStateBasicIO } from 'e2e-shared/specs/basic-io'

export default UseQueryStateBasicIO

export const getConfig = async () => {
  return {
    render: 'dynamic'
  } as const
}
