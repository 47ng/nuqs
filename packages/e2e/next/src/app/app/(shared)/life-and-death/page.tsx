import { LifeAndDeath } from 'e2e-shared/specs/life-and-death'
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense>
      <LifeAndDeath />
    </Suspense>
  )
}
