import dynamic from 'next/dynamic'
import React, { Suspense } from 'react'
import { PlaygroundPageLayout } from './_components/playground-page-layout'

export const metadata = {
  title: 'next-usequerystate playground',
  description:
    'useQueryState hook for Next.js - Like React.useState, but stored in the URL query string'
}

const DebugControlsSkeleton = () => (
  <span style={{ opacity: 0.5, pointerEvents: 'none' }}>
    <input type="checkbox" disabled />
    <label>Console debugging</label>
  </span>
)

const DebugControl = dynamic(() => import('./_components/debug-control'), {
  ssr: false,
  loading: DebugControlsSkeleton
})

export default function PlaygroundLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <header>
        <strong>
          <code>next-usequerystate</code>
        </strong>{' '}
        • <a href="https://github.com/47ng/next-usequerystate">GitHub</a> •{' '}
        <a href="https://www.npmjs.com/package/next-usequerystate">NPM</a> •{' '}
        <a href="https://francoisbest.com/posts/2023/storing-react-state-in-the-url-with-nextjs">
          How it works
        </a>
        {' • '}
        <Suspense fallback={<DebugControlsSkeleton />}>
          <DebugControl />
        </Suspense>
      </header>
      <hr />
      <PlaygroundPageLayout>{children}</PlaygroundPageLayout>
    </>
  )
}
