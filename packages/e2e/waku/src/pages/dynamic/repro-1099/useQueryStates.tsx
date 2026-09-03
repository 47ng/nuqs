import { Repro1099UseQueryStates } from 'e2e-shared/specs/repro-1099'

export default Repro1099UseQueryStates

export const getConfig = async () => {
  return {
    render: 'dynamic'
  } as const
}
