import { Suspense } from 'react'
import { QuerySpy } from '../../../components/query-spy'

export default function E2EPageLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Suspense>
        <QuerySpy />
      </Suspense>
      {children}
    </>
  )
}
