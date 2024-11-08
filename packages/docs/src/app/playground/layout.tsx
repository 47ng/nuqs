import { getSharedLayoutProps } from '@/src/components/shared-layout'
import { DocsLayout } from 'fumadocs-ui/layout'
import { DocsBody, DocsPage } from 'fumadocs-ui/page'
import dynamic from 'next/dynamic'
import Link from 'next/link'
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
          banner: (
            <div className="my-2 flex justify-center gap-2 rounded-lg border border-blue-500/40 bg-blue-100/50 py-2.5 font-semibold dark:bg-blue-700/10">
              <span aria-hidden>🎉</span>
              <Link
                href="/blog/nuqs-2"
                className="text-blue-900 hover:underline focus-visible:underline focus-visible:outline-none dark:text-blue-100"
                prefetch={false}
              >
                Announcing nuqs v2 !
              </Link>
              <span aria-hidden>🎉</span>
            </div>
          ),
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
