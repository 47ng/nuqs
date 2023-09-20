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
        <header>
          <strong>
            <code>next-usequerystate</code>
          </strong>{' '}
          • <a href="https://github.com/47ng/next-usequerystate">GitHub</a> •{' '}
          <a href="https://www.npmjs.com/package/next-usequerystate">NPM</a> •{' '}
          <a href="https://francoisbest.com/posts/2023/storing-react-state-in-the-url-with-nextjs">
            How it works
          </a>
        </header>
        <hr />
        {children}
      </body>
    </html>
  )
}
