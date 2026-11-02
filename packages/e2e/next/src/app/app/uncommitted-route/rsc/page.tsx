import { connection } from 'next/server'
import { Init } from '../Init'

// Async Server Component fetching data, with no loading.tsx / Suspense.
async function SlowResults() {
  await connection()
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
