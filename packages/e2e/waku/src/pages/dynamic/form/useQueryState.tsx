import { TestFormUseQueryState } from 'e2e-shared/specs/form'

export default TestFormUseQueryState

export const getConfig = async () => {
  return {
    render: 'dynamic'
  } as const
}
