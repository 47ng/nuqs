import { QuerySpy } from '@/src/components/query-spy'
import { QuerystringSkeleton } from '@/src/components/querystring'
import React, { Suspense } from 'react'

export default function PlaygroundDemoLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="px-4 md:px-2">
      <Suspense fallback={<QuerystringSkeleton>&nbsp;</QuerystringSkeleton>}>
        <QuerySpy />
      </Suspense>
      {children}
    </div>
  )
}
