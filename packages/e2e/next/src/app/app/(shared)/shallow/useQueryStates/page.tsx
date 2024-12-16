import { ShallowUseQueryStates } from 'e2e-shared/specs/shallow'
import { ShallowDisplay } from 'e2e-shared/specs/shallow.server'
import {
  createSearchParamsCache,
  parseAsString,
  type SearchParams
} from 'nuqs/server'
import { Suspense } from 'react'

type PageProps = {
  searchParams: Promise<SearchParams>
}

const cache = createSearchParamsCache(
  {
    state: parseAsString
  },
  {
    urlKeys: {
      state: 'test'
    }
  }
)

export default async function Page({ searchParams }: PageProps) {
  await cache.parse(searchParams)
  return (
    <>
      <Suspense>
        <ShallowUseQueryStates />
      </Suspense>
      <ShallowDisplay environment="server" state={cache.get('state')} />
    </>
  )
}
