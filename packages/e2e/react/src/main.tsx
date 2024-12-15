import { HydrationMarker } from 'e2e-shared/components/hydration-marker'
import { NuqsAdapter } from 'nuqs/adapters/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Router } from './routes'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HydrationMarker />
    <NuqsAdapter>
      <Router />
    </NuqsAdapter>
  </StrictMode>
)
