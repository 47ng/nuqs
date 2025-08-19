import type { LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData, useParams } from '@remix-run/react'
import { Display } from 'e2e-shared/components/display'
import { DisplaySegments, UrlControls } from 'e2e-shared/specs/dynamic-segments'
import { createLoader, parseAsString } from 'nuqs'

const loadSearchParams = createLoader({
  test: parseAsString
})

export function loader({ request, params }: LoaderFunctionArgs) {
  const { test: serverState } = loadSearchParams(request)
  return {
    serverState,
    serverSegments: [params.segment]
  }
}

export default function Page() {
  const { serverState, serverSegments } = useLoaderData<typeof loader>()
  const params = useParams()
  return (
    <>
      <UrlControls>
        <Display environment="server" state={serverState} />
      </UrlControls>
      <DisplaySegments environment="server" segments={serverSegments} />
      <DisplaySegments
        environment="client"
        segments={[params.segment as string]}
      />
    </>
  )
}
