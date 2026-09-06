import { Json } from 'e2e-shared/specs/json'

export default Json

export const getConfig = async () => {
  return {
    render: 'dynamic'
  } as const
}
