import { Display } from 'e2e-shared/components/display'
import { DisplaySegments, UrlControls } from 'e2e-shared/specs/dynamic-segments'
import { createLoader, parseAsString, type SearchParams } from 'nuqs/server'
import { Suspense } from 'react'
import { ClientSegment } from './client'

type PageProps = {
  params: Promise<{ segment: string }>
  searchParams: Promise<SearchParams>
}

const loadTest = createLoader({
  test: parseAsString
})

export default async function DynamicPage(props: PageProps) {
  const searchParams = await props.searchParams
  const { segment } = await props.params
  const { test: serverState } = loadTest(searchParams)
  return (
    <>
      <Suspense>
        <UrlControls>
          <Display environment="server" state={serverState} />
        </UrlControls>
      </Suspense>
      <Suspense>
        <ClientSegment>
          <DisplaySegments environment="server" segments={[segment]} />
        </ClientSegment>
      </Suspense>
    </>
  )
}
