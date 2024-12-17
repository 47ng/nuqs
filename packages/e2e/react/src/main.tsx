import { NuqsAdapter, enableHistorySync } from 'nuqs/adapters/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RootLayout } from './layout'
import { Router } from './routes'

enableHistorySync()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NuqsAdapter>
      <RootLayout>
        <Router />
      </RootLayout>
    </NuqsAdapter>
  </StrictMode>
)
