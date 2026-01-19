import { DebounceClient } from 'e2e-shared/specs/debounce-client'
import { DebounceServer } from 'e2e-shared/specs/debounce-server'
import {
  type DemoSearchParams,
  loadDemoSearchParams
} from 'e2e-shared/specs/debounce.defs'
import { LoaderFunctionArgs, useLoaderData } from 'react-router-dom'

export function loader({ request }: LoaderFunctionArgs) {
  return loadDemoSearchParams(request)
}

export default function Page() {
  const serverState = useLoaderData() as DemoSearchParams
  return (
    <DebounceServer state={serverState}>
      <DebounceClient navigateHref="/debounce/other" />
    </DebounceServer>
  )
}
