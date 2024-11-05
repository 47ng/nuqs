'use client'

import { Suspense } from 'react'
import { RoutingTourView } from '../_components/view'

export default function Page() {
  return (
    <Suspense>
      <PageC />
    </Suspense>
  )
}

function PageC() {
  return <RoutingTourView thisPage="c" nextPage="d" />
}
