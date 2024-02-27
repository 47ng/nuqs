import { Suspense } from 'react'
import { getStarHistory } from '../lib/github'
import { StarsGraph } from './stars.client'

export async function StarHistoryGraph() {
  const stars = await getStarHistory()
  return (
    <Suspense>
      <StarsGraph data={stars} />
    </Suspense>
  )
}
