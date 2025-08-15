import { getSharedLayoutProps } from '@/src/components/shared-layout'
import { DocsLayout } from 'fumadocs-ui/layouts/notebook'
import { DocsBody, DocsPage } from 'fumadocs-ui/page'
import React, { Suspense } from 'react'
import { getPlaygroundTree } from './(demos)/demos'
import { DebugControl } from './debug-control'

const DebugControlsSkeleton = () => (
  <label className="pointer-events-none mr-auto space-x-2 text-zinc-500 opacity-50">
    <input type="checkbox" disabled />
    <span>Console debugging</span>
  </label>
)

export default function PlaygroundLayout({
  children
}: {
  children: React.ReactNode
}) {
  const shared = getSharedLayoutProps()

  return (
    <>
      <DocsLayout
        tree={getPlaygroundTree()}
        {...shared}
        nav={{ ...shared.nav, mode: 'top' }}
        sidebar={{
          // banner: <ReactParis2025SideBanner />,
          footer: (
            <Suspense fallback={<DebugControlsSkeleton />}>
              <DebugControl />
            </Suspense>
          )
        }}
      >
        <DocsPage>
          <DocsBody>{children}</DocsBody>
        </DocsPage>
      </DocsLayout>
    </>
  )
}
