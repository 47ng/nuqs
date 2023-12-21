import Link from 'next/link'
import { Suspense } from 'react'
import { Client } from './_components/client'

export default function Home() {
  return (
    <main>
      <h1>Home Page</h1>
      <Link href="/demos/repro-430/another">Go to another page</Link>
      <Suspense>
        <Client />
      </Suspense>
    </main>
  )
}
