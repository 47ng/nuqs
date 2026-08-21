import { ConditionalRenderingUseQueryStates } from 'e2e-shared/specs/conditional-rendering'

export default ConditionalRenderingUseQueryStates

export const getConfig = async () => {
  return {
    render: 'dynamic'
  } as const
}
