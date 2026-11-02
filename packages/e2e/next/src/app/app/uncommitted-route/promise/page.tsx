import { headers } from 'next/headers'
import { Init } from '../Init'
import { Results } from './Results'

async function fetchResults() {
  // A dynamic API, available from Next 14 (sync) to 16 (async, cacheComponents).
  await headers()
  await new Promise(resolve => setTimeout(resolve, 1500))
  return 'promise results'
}

// Server passes an unawaited promise, the client unwraps it with use().
export default function Page() {
  return (
    <>
      <Init label="promise" />
      <Results data={fetchResults()} />
    </>
  )
}
