import { LoaderRenderer, loadSearchParams } from 'e2e-shared/specs/loader'
import type { SearchParams } from 'nuqs/server'

type PageProps = {
  searchParams: Promise<SearchParams>
}

export default async function Page({ searchParams }: PageProps) {
  const serverValues = await loadSearchParams(searchParams)
  return <LoaderRenderer serverValues={serverValues} />
}
