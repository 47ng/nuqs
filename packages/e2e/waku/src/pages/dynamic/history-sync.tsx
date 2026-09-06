import { HistorySync } from 'e2e-shared/specs/history-sync'

export default HistorySync

export const getConfig = async () => {
  return {
    render: 'dynamic'
  } as const
}
