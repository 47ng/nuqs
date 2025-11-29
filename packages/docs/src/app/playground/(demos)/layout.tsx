import { QuerySpy } from '@/src/components/query-spy'
import { QuerystringSkeleton } from '@/src/components/querystring'
import { DemoTabsWrapper } from '@/src/components/codesandbox/demo-tabs-wrapper'
import React, { Suspense } from 'react'

const DEMO_PATHS: Record<string, string> = {
  'basic-counter': 'basic-counter/client.tsx',
  'batching': 'batching/client.tsx',
  'hex-colors': 'hex-colors/client.tsx',
  // 'pagination': 'pagination/pagination-controls.client.tsx', // Not included because it's server component
  'tic-tac-toe': 'tic-tac-toe/client.tsx',
}

export default function PlaygroundDemoLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Suspense fallback={<QuerystringSkeleton>&nbsp;</QuerystringSkeleton>}>
        <QuerySpy />
      </Suspense>
      <DemoTabsWrapper demoPaths={DEMO_PATHS}>{children}</DemoTabsWrapper>
    </>
  )
}
