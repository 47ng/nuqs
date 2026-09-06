import { Scroll } from 'e2e-shared/specs/scroll'

export default Scroll

export const getConfig = async () => {
  return {
    render: 'dynamic'
  } as const
}
