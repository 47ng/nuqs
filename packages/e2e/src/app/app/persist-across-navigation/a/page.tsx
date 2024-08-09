'use client'

import { Suspense } from 'react'
import { Client } from '../client'

export default function Page() {
  return (
    <Suspense>
      <Client page="a" target="b" />
    </Suspense>
  )
}
