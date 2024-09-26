import type { SearchParams } from 'nuqs/server'
import { Client } from './client'
import { searchParamsCache } from './searchParams'

export default async function Page({
  searchParams
}: {
  searchParams: Promise<SearchParams>
}) {
  const { server } = await searchParamsCache.parse(searchParams)
  return (
    <>
      <p>
        Server side: <span id="server-side">{server}</span>
      </p>
      <Client />
    </>
  )
}
