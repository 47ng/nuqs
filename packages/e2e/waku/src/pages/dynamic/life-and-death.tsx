import { LifeAndDeath } from 'e2e-shared/specs/life-and-death'

export default LifeAndDeath

export const getConfig = async () => {
  return {
    render: 'dynamic'
  } as const
}
