import type { SearchParams } from 'nuqs/server'
import { Suspense } from 'react'
import { All } from './all'
import { Get } from './get'
import { cache } from './searchParams'
import { Set } from './set'

type Props = {
  searchParams: Promise<SearchParams>
}

export default async function Page({ searchParams }: Props) {
  const { str, bool, num, def, nope, idx } = await cache.parse(searchParams)
  return (
    <>
      <h1>Root page</h1>
      <h2>From parse:</h2>
      <p style={{ display: 'flex', gap: '1rem' }}>
        <span id="parse-str">{str}</span>
        <span id="parse-num">{num}</span>
        <span id="parse-idx">{String(idx)}</span>
        <span id="parse-bool">{String(bool)}</span>
        <span id="parse-def">{def}</span>
        <span id="parse-nope">{String(nope)}</span>
      </p>
      <All />
      <Get />
      <Suspense>
        <Set />
      </Suspense>
    </>
  )
}

export async function generateMetadata({ searchParams }: Props) {
  // parse here too to ensure we can idempotently parse the same search params as the page in the same request
  const { str } = await cache.parse(searchParams)
  return {
    title: `metadata-title-str:${str}`
  }
}
