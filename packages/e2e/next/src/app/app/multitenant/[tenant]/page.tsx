import { Display } from 'e2e-shared/components/display'
import { ShallowUseQueryState } from 'e2e-shared/specs/shallow'
import {
  createSearchParamsCache,
  parseAsString,
  type SearchParams
} from 'nuqs/server'
import { Suspense } from 'react'
import { TenantClient } from './client-tenant'

type PageProps = {
  params: Promise<{ tenant: string }>
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

export default async function TenantPage({ params, searchParams }: PageProps) {
  const { tenant } = await params
  if (!tenant) {
    return <div>Error: Tenant not found.</div>
  }
  await cache.parse(searchParams)

  return (
    <>
      <Suspense>
        <ShallowUseQueryState />
      </Suspense>
      <Display environment="server" state={cache.get('state')} />
      <p id="server-tenant">{tenant}</p>
      <Suspense>
        <TenantClient />
      </Suspense>
    </>
  )
}
