import { Stitching } from 'e2e-shared/specs/stitching'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <Stitching />
    </Suspense>
  )
}
