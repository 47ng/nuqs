import { RenderCount } from 'e2e-shared/specs/render-count'
import {
  loadParams,
  loadSearchParams
} from 'e2e-shared/specs/render-count.params'
import { setTimeout } from 'node:timers/promises'
import { type SearchParams } from 'nuqs/server'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<Record<keyof ReturnType<typeof loadParams>, string>>
  searchParams: Promise<SearchParams>
}

export default async function Page({
  params,
  searchParams
}: PageProps & { searchParams: Promise<SearchParams> }) {
  const { hook, shallow, history, startTransition } = await loadParams(params)
  const { delay } = await loadSearchParams(searchParams)
  if (delay) {
    await setTimeout(delay)
  }
  return (
    <Suspense>
      <RenderCount
        hook={hook}
        shallow={shallow}
        history={history}
        startTransition={startTransition}
      />
    </Suspense>
  )
}

export async function generateStaticParams() {
  const hooks = ['useQueryState', 'useQueryStates']
  const shallow = [true, false]
  const history = ['push', 'replace']
  return hooks.flatMap(hook =>
    shallow.flatMap(shallow =>
      history.map(history => ({ hook, shallow: shallow.toString(), history }))
    )
  )
}
