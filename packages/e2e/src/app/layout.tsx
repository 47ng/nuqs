import React, { Suspense } from 'react'
import { HydrationMarker } from '../components/hydration-marker'

export const metadata = {
  title: 'next-usequerystate playground',
  description:
    'useQueryState hook for Next.js - Like React.useState, but stored in the URL query string'
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
        {children}
      </body>
    </html>
  )
}
