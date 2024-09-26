import { setTimeout } from 'node:timers/promises'
import type { SearchParams } from 'nuqs/server'
import { Suspense } from 'react'
import { Client } from './client'

type PageProps = {
  searchParams: Promise<SearchParams>
}

export default async function Page({ searchParams }: PageProps) {
  await setTimeout(1000)
  return (
    <>
      <h1>Transitions</h1>
      <pre id="server-rendered">{JSON.stringify(await searchParams)}</pre>
      <Suspense>
        <Client />
      </Suspense>
    </>
  )
}
