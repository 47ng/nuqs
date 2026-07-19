import { fullBleedPageClassName } from '@/src/components/shared-layout'
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
    <DocsPage
      className={fullBleedPageClassName}
      footer={{ enabled: false }}
      tableOfContent={{ enabled: false }}
      tableOfContentPopover={{ enabled: false }}
    >
      <Suspense fallback={<QuerystringSkeleton>&nbsp;</QuerystringSkeleton>}>
        <QuerySpy />
      </Suspense>
      {children}
    </DocsPage>
  )
}
