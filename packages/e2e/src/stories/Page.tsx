import type { SearchParams } from 'nuqs/server'
import { NestedComponent } from './nested-component'
import { searchParamsCache } from './search-params'

export async function Page({
  searchParams
}: {
  searchParams: Promise<SearchParams>
}) {
  const parsed = await searchParamsCache.parse(searchParams)
  console.dir(parsed)
  return <NestedComponent />
}
