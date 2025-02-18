import { type SearchParams } from 'nuqs'
import { Suspense } from 'react'
import { Client } from './client'
import { loadSearchParams } from './search-params'

type PageProps = {
  searchParams: Promise<SearchParams>
}

export default async function Page({ searchParams }: PageProps) {
  const { search, pageIndex } = await loadSearchParams(searchParams)
  return (
    <>
      <h2>Server</h2>
      <p>Search: {search}</p>
      <p>Page Index: {pageIndex}</p>
      <h2>Client</h2>
      <Suspense>
        <Client />
      </Suspense>
    </>
  )
}
