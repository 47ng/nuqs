'use client'

import { Suspense } from 'react'
import { RoutingTourView } from '../_components/view'

export default function Page() {
  return (
    <Suspense>
      <PageD />
    </Suspense>
  )
}

function PageD() {
  return <RoutingTourView thisPage="d" nextPage="a" />
}
