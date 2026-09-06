import { TestFormUseQueryStates } from 'e2e-shared/specs/form'

export default TestFormUseQueryStates

export const getConfig = async () => {
  return {
    render: 'dynamic'
  } as const
}
