import { Repro1358RouteA } from 'e2e-shared/specs/repro-1358'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <Repro1358RouteA otherPageHref="/app/repro-1358/b" />
    </Suspense>
  )
}
