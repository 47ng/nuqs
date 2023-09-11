import { Suspense } from 'react'
import { ServerSideParsingDemoClient } from './client'
import { counterParser } from './parser'

type PageProps = {
  searchParams: {
    counter?: string
  }
}

export default function ServerSideParsingDemo({ searchParams }: PageProps) {
  const counter =
    counterParser.parse(searchParams.counter ?? '') ??
    counterParser.defaultValue
  console.log('Server side counter: %d', counter)
  return (
    <>
      <Suspense>
        <ServerSideParsingDemoClient serverSideCounter={counter}>
          <p>Server rendered counter: {counter}</p>
        </ServerSideParsingDemoClient>
      </Suspense>
    </>
  )
}
