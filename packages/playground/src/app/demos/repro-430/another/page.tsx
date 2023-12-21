import Link from 'next/link'
import { Suspense } from 'react'
import { Client } from '../_components/client'

export default function AnotherPage() {
  return (
    <main>
      <h1>Another Page</h1>
      <Link href="/demos/repro-430">Go to Home page</Link>
      <Suspense>
        <Client />
      </Suspense>
    </main>
  )
}
