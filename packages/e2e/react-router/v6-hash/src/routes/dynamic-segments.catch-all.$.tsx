import { Display } from 'e2e-shared/components/display'
import { DisplaySegments, UrlControls } from 'e2e-shared/specs/dynamic-segments'
import { createLoader, parseAsString } from 'nuqs'
import {
  useLoaderData,
  useParams,
  type LoaderFunctionArgs
} from 'react-router-dom'

const loadSearchParams = createLoader({
  test: parseAsString
})

export function loader({ request, params }: LoaderFunctionArgs) {
  const { test: serverState } = loadSearchParams(request)
  return {
    serverState,
    serverSegments: params['*']?.split('/') ?? []
  }
}

export default function Page() {
  const { serverState, serverSegments } = useLoaderData() as ReturnType<
    typeof loader
  >
  const clientSegments = useParams()['*']?.split('/') ?? []
  return (
    <>
      <UrlControls>
        <Display environment="server" state={serverState} />
      </UrlControls>
      <DisplaySegments environment="server" segments={serverSegments} />
      <DisplaySegments environment="client" segments={clientSegments} />
    </>
  )
}
