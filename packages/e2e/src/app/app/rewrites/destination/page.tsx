import type { SearchParams } from 'nuqs/server'
import { Suspense } from 'react'
import { RewriteDestinationClient } from './client'
import { cache } from './searchParams'

export default function RewriteDestinationPage({
  searchParams
}: {
  searchParams: SearchParams
}) {
  const { injected, through } = cache.parse(searchParams)
  return (
    <>
      <p>
        Injected (server): <span id="injected-server">{injected}</span>
      </p>
      <p>
        Through (server): <span id="through-server">{through}</span>
      </p>
      <Suspense>
        <RewriteDestinationClient />
      </Suspense>
    </>
  )
}
