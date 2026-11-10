import { headers } from 'next/headers'
import { Init } from '../Init'

// Async Server Component fetching data, with no loading.tsx / Suspense.
async function SlowResults() {
  // A dynamic API, available from Next 14 (sync) to 16 (async, cacheComponents).
  await headers()
  await new Promise(resolve => setTimeout(resolve, 1500))
  return <p id="results">rsc results</p>
}

export default function Page() {
  return (
    <>
      <Init label="rsc" />
      <SlowResults />
    </>
  )
}
