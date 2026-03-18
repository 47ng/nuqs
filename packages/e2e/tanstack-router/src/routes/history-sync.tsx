import { createFileRoute } from '@tanstack/react-router'
import { HistorySync } from 'e2e-shared/specs/history-sync'

export const Route = createFileRoute('/history-sync')({
  component: HistorySync
})
