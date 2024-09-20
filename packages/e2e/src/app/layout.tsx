import { NuqsAdapter } from 'nuqs/adapters/next'
import React, { Suspense } from 'react'
import { HydrationMarker } from '../components/hydration-marker'

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
