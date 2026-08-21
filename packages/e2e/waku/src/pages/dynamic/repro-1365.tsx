import { Repro1365 } from 'e2e-shared/specs/repro-1365'

export default Repro1365

export const getConfig = async () => {
  return {
    render: 'dynamic'
  } as const
}
