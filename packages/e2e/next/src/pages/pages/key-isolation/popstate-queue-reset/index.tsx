import { createIsolatedPage } from '@/components/isolated-page'
import { PopstateQueueResetClient } from 'e2e-shared/specs/popstate-queue-reset'
import NextRouter from 'next/router'

export default createIsolatedPage(
  <PopstateQueueResetClient
    onNavigateToOther={() =>
      NextRouter.push('/pages/key-isolation/popstate-queue-reset/other')
    }
  />
)
