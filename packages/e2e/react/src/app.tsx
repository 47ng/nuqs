import { enableHistorySync, NuqsAdapter } from 'nuqs/adapters/react'
import { useEffect } from 'react'
import { RootLayout } from './layout'
import { Router } from './routes'

function HistorySync() {
  useEffect(() => {
    enableHistorySync()
  }, [])
  return null
}

export function App() {
  const historySyncEnabled = location.pathname !== '/queue-lifecycle'
  return (
    <NuqsAdapter
      fullPageNavigationOnShallowFalseUpdates={
        process.env.FULL_PAGE_NAV_ON_SHALLOW_FALSE === 'true'
      }
    >
      {historySyncEnabled && <HistorySync />}
      <RootLayout>
        <Router />
      </RootLayout>
    </NuqsAdapter>
  )
}
