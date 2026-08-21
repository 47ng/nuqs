import { NativeArray } from 'e2e-shared/specs/native-array'

export default NativeArray

export const getConfig = async () => {
  return {
    render: 'dynamic'
  } as const
}
