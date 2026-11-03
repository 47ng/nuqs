import { Suspense } from 'react'
import { PageB } from '../client'

export default function Page() {
  return (
    <Suspense>
      <PageB />
    </Suspense>
  )
}
