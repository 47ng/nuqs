import { LanePriority } from 'e2e-shared/specs/lane-priority'

export default LanePriority

export const getConfig = async () => {
  return {
    render: 'dynamic'
  } as const
}
