import { Repro1358RouteB } from 'e2e-shared/specs/repro-1358'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <Repro1358RouteB otherPageHref="/app/repro-1358/a" />
    </Suspense>
  )
}
