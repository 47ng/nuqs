import { Suspense } from 'react'
import { ServerSideParsingDemoClient } from './client'
import { counterParser } from './parser'

type PageProps = {
  searchParams: {
    counter?: string | string[]
  }
}

export default function ServerSideParsingDemo({ searchParams }: PageProps) {
  const counter = counterParser.parseServerSide(searchParams.counter)
  console.log('Server side counter: %d', counter)
  return (
    <>
      <h1>Server-side parsing</h1>
      <Suspense>
        <ServerSideParsingDemoClient serverSideCounter={counter}>
          <p>Server rendered counter: {counter}</p>
        </ServerSideParsingDemoClient>
      </Suspense>
    </>
  )
}
