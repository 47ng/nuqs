import { NuqsWordmark } from '@/src/components/logo'
import { navItems } from '@/src/components/nav'
import { DocsLayout } from 'next-docs-ui/layout'
import { DocsBody } from 'next-docs-ui/page'
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
        nav={{
          title: <NuqsWordmark className="px-3" />,
          items: navItems,
          githubUrl: 'https://github.com/47ng/nuqs'
        }}
        sidebar={{
          collapsible: false,
          footer: <DebugControl />
        }}
      >
        <DocsBody className="min-w-0 flex-1">{children}</DocsBody>
      </DocsLayout>
    </>
  )
}
