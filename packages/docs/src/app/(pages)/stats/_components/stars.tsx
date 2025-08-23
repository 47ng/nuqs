import { Suspense } from 'react'
import { getStarHistory } from '../lib/github'
import { StarsGraph } from './stars.client'
import StargazersList from './stars.gazers-list'

export async function StarHistoryGraph() {
  const stars = await getStarHistory()
  return (
    <Suspense>
      <StarsGraph
        data={stars}
        stargazersTab={<StargazersList stars={stars} />}
      />
    </Suspense>
  )
}
