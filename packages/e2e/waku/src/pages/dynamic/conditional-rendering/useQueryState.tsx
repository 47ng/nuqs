import { ConditionalRenderingUseQueryState } from 'e2e-shared/specs/conditional-rendering'

export default ConditionalRenderingUseQueryState

export const getConfig = async () => {
  return {
    render: 'dynamic'
  } as const
}
