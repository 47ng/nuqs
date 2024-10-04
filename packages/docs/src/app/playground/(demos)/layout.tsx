import React, { Suspense } from 'react'
import { QuerySpy } from './_components/query-spy'
import { QuerySpySkeleton } from './_components/query-spy.skeleton'

export default function PlaygroundDemoLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Suspense fallback={<QuerySpySkeleton>&nbsp;</QuerySpySkeleton>}>
        <QuerySpy />
      </Suspense>
      {children}
    </>
  )
}
