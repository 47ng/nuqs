import { Scroll } from 'e2e-shared/specs/scroll'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <Scroll />
    </Suspense>
  )
}
