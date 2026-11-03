import { Suspense } from 'react'
import { PageA } from '../client'

export default function Page() {
  return (
    <Suspense>
      <PageA />
    </Suspense>
  )
}
