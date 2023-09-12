import { Suspense } from 'react'
import { RoutingTourView } from '../_components/view'

export default function PageA() {
  return (
    <Suspense>
      <RoutingTourView thisPage="a" nextPage="b" />
    </Suspense>
  )
}
