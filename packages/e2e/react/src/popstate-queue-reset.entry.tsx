import { NuqsAdapter } from 'nuqs/adapters/react'
import { createRoot } from 'react-dom/client'
import { RootLayout } from './layout'
import PopstateQueueReset from './routes/popstate-queue-reset'

createRoot(document.getElementById('root')!).render(
  <NuqsAdapter>
    <RootLayout>
      <PopstateQueueReset />
    </RootLayout>
  </NuqsAdapter>
)
