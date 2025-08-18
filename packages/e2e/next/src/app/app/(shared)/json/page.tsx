import { Json } from 'e2e-shared/specs/json'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <Json />
    </Suspense>
  )
}
