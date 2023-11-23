import { setTimeout } from 'node:timers/promises'
import { Suspense } from 'react'
import { Client } from './client'

type PageProps = {
  searchParams: Record<string, string | string[] | undefined>
}

export default async function Page({ searchParams }: PageProps) {
  await setTimeout(1000)
  return (
    <>
      <h1>Transitions</h1>
      <pre id="server-rendered">{JSON.stringify(searchParams)}</pre>
      <Suspense>
        <Client />
      </Suspense>
    </>
  )
}
