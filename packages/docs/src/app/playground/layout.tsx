import { getSharedLayoutProps } from '@/src/components/shared-layout'
import { DocsLayout } from 'fumadocs-ui/layout'
import { DocsBody, DocsPage } from 'fumadocs-ui/page'
import dynamic from 'next/dynamic'
import React from 'react'
import { getPlaygroundTree } from './(demos)/demos'

const DebugControlsSkeleton = () => (
  <label className="pointer-events-none mr-auto space-x-2 text-zinc-500 opacity-50">
    <input type="checkbox" disabled />
    <span>Console debugging</span>
  </label>
)

const DebugControl = dynamic(() => import('./debug-control'), {
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
      <DocsLayout
        tree={getPlaygroundTree()}
        {...getSharedLayoutProps()}
        sidebar={{
          collapsible: false,
          footer: <DebugControl />
        }}
      >
        <DocsPage>
          <DocsBody>{children}</DocsBody>
        </DocsPage>
      </DocsLayout>
    </>
  )
}
