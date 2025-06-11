import { DebounceClient } from 'e2e-shared/specs/debounce-client'
import { DebounceServer } from 'e2e-shared/specs/debounce-server'
import { loadDemoSearchParams } from 'e2e-shared/specs/debounce.defs'
import { type SearchParams } from 'nuqs'
import { Suspense } from 'react'

type PageProps = {
  searchParams: Promise<SearchParams>
}

export default async function Page({ searchParams }: PageProps) {
  const serverState = await loadDemoSearchParams(searchParams)
  return (
    <DebounceServer state={serverState}>
      <Suspense>
        <DebounceClient navigateHref="/app/debounce/other" />
      </Suspense>
    </DebounceServer>
  )
}
