import { HydrationMarker } from 'e2e-shared/components/hydration-marker'
import { NuqsAdapter as UnifiedNuqsAdapter } from 'nuqs/adapters/next'
import { NuqsAdapter as AppRouterNuqsAdapter } from 'nuqs/adapters/next/app'
import { Fragment, type ReactNode, Suspense } from 'react'
import { Providers } from './providers'

export const metadata = {
  title: 'nuqs e2e test bench'
}

const SuspenseIfCacheComponents =
  process.env.CACHE_COMPONENTS === 'true' ? Suspense : Fragment
const NuqsAdapter =
  process.env.NUQS_E2E_UNIFIED_ADAPTER === 'true'
    ? UnifiedNuqsAdapter
    : AppRouterNuqsAdapter

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html>
      <body>
        <Suspense>
          <HydrationMarker />
        </Suspense>
        <NuqsAdapter>
          <Providers>
            <SuspenseIfCacheComponents>{children}</SuspenseIfCacheComponents>
          </Providers>
        </NuqsAdapter>
      </body>
    </html>
  )
}
