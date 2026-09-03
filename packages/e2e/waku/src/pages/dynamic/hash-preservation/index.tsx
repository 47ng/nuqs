import { HashPreservation } from 'e2e-shared/specs/hash-preservation'

export default HashPreservation

export const getConfig = async () => {
  return {
    render: 'dynamic'
  } as const
}
