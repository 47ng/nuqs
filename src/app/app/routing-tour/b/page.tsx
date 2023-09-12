import { Suspense } from 'react'
import { RoutingTourView } from '../_components/view'

export default function PageB() {
  return (
    <Suspense>
      <RoutingTourView thisPage="b" nextPage="c" />
    </Suspense>
  )
}
