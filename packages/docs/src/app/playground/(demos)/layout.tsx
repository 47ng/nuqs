import { QuerySpy } from '@/src/components/query-spy'
import { QuerystringSkeleton } from '@/src/components/querystring'
import { DocsPage } from 'fumadocs-ui/page'
import React, { Suspense } from 'react'

export default function PlaygroundDemoLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <DocsPage>
        <Suspense fallback={<QuerystringSkeleton>&nbsp;</QuerystringSkeleton>}>
          <QuerySpy />
        </Suspense>
        {children}
      </DocsPage>
    </>
  )
}
