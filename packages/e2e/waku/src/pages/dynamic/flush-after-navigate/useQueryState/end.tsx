import { FlushAfterNavigateEnd } from 'e2e-shared/specs/flush-after-navigate'

export default FlushAfterNavigateEnd

export const getConfig = async () => {
  return {
    render: 'dynamic'
  } as const
}
