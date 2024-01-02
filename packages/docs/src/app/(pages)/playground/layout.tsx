import dynamic from 'next/dynamic'
import React, { Suspense } from 'react'
import { PlaygroundPageLayout } from './_components/playground-page-layout'

export const metadata = {
  title: 'Playground'
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
        <Suspense fallback={<DebugControlsSkeleton />}>
          <DebugControl />
        </Suspense>
      </header>
      <hr />
      <PlaygroundPageLayout>{children}</PlaygroundPageLayout>
    </>
  )
}
