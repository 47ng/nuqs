import { Repro1501 } from '../../lib/repro-1501'

export default Repro1501

export const getConfig = async () => {
  return {
    render: 'dynamic'
  } as const
}
