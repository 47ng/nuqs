import { NuqsAdapter } from 'nuqs/adapters/next/app'
import React, { Suspense } from 'react'
import { HydrationMarker } from 'e2e-shared/components/hydration-marker'

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
        <NuqsAdapter>{children}</NuqsAdapter>
      </body>
    </html>
  )
}
