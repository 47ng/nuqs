import { PrettyUrls } from 'e2e-shared/specs/pretty-urls'

export default PrettyUrls

export const getConfig = async () => {
  return {
    render: 'dynamic'
  } as const
}
