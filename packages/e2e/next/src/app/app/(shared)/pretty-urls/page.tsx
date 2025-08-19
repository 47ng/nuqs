import { PrettyUrls } from 'e2e-shared/specs/pretty-urls'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <PrettyUrls />
    </Suspense>
  )
}
