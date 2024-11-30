import { getSharedLayoutProps } from '@/src/components/shared-layout'
import { DocsLayout } from 'fumadocs-ui/layouts/docs'
import { DocsBody, DocsPage } from 'fumadocs-ui/page'
import Link from 'next/link'
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
