'use client'

import Link from 'next/link'
import { parseAsInteger, useQueryState } from 'nuqs'

const pageParser = parseAsInteger.withDefault(1)

export function PageA() {
  const [page, setPage] = useQueryState('page', pageParser)
  return (
    <>
      <div data-testid="page-value">{page}</div>
      <button onClick={() => setPage(2)}>Set to 2</button>
      <Link href="/app/navigation-reset/b">Go to page B</Link>
    </>
  )
}

export function PageB() {
  const [page] = useQueryState('page', pageParser)
  return <div data-testid="page-value">{page}</div>
}
