import { NuqsAdapter, enableHistorySync } from 'nuqs/adapters/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RootLayout } from './layout'
import { Router } from './routes'

enableHistorySync()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NuqsAdapter
      reloadPageOnShallowFalseUpdates={
        process.env.RELOAD_ON_SHALLOW_FALSE === 'true'
      }
    >
      <RootLayout>
        <Router />
      </RootLayout>
    </NuqsAdapter>
  </StrictMode>
)
