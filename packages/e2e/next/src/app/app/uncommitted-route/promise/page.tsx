import { connection } from 'next/server'
import { Init } from '../Init'
import { Results } from './Results'

async function fetchResults() {
  await connection()
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
