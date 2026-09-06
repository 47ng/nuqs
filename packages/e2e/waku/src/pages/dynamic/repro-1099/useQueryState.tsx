import { Repro1099UseQueryState } from 'e2e-shared/specs/repro-1099'

export default Repro1099UseQueryState

export const getConfig = async () => {
  return {
    render: 'dynamic'
  } as const
}
