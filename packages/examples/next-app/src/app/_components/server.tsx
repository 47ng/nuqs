import type { SearchParams } from 'next/dist/server/request/search-params'
import { loadSearchParams } from '../searchParams'

export async function Server({
  searchParams
}: {
  searchParams: Promise<SearchParams>
}) {
  const parsed = await loadSearchParams(searchParams)
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">Server-Side Search Params</h2>
      <pre className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded">
        {JSON.stringify(parsed, null, 2)}
      </pre>
    </div>
  )
}
