import { Repro1506 } from 'e2e-shared/specs/repro-1506'

export default Repro1506

export const getConfig = async () => {
  return {
    render: 'dynamic'
  } as const
}
