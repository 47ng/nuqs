import { HydrationMarker } from 'e2e-shared/components/hydration-marker'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import React, { Suspense } from 'react'
import { Providers } from './providers'

export const metadata = {
  title: 'nuqs e2e test bench'
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body>
        <Suspense>
          <HydrationMarker />
        </Suspense>
        <NuqsAdapter>
          <Providers>{children}</Providers>
        </NuqsAdapter>
      </body>
    </html>
  )
}
