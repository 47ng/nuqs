import { setTimeout } from 'node:timers/promises'
import { Suspense } from 'react'
import { Client } from './client'
import { delayParser, queryParser } from './parsers'

type PageParams = {
  searchParams: {
    q?: string | string[]
    serverDelay?: string | string[]
  }
}

export default async function ThottlingDemoPage({ searchParams }: PageParams) {
  const serverDelay = delayParser.parseServerSide(searchParams.serverDelay)
  const query = queryParser.parseServerSide(searchParams.q)
  await setTimeout(serverDelay)
  console.debug('Server query: %s', query)
  return (
    <>
      <h1>Throttling</h1>
      <p>
        Play with the various delays, and try throttling your network connection
        in devtools.
      </p>
      <p>
        When the client is faster to update the URL than the network is to
        re-render the server components, the server may hang under the waterfall
        of heavy load.
      </p>
      <h2>Server</h2>
      <p>Server delay: {serverDelay} ms</p>
      <p>Server query: {query}</p>
      <Suspense>
        <Client />
      </Suspense>
      <p>
        <a href="https://github.com/47ng/next-usequerystate/blob/next/src/app/demos/thottling/page.tsx">
          Source on GitHub
        </a>
      </p>
    </>
  )
}
