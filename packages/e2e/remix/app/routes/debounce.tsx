import type { LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { DebounceClient } from 'e2e-shared/specs/debounce-client'
import { DebounceServer } from 'e2e-shared/specs/debounce-server'
import {
  type DemoSearchParams,
  loadDemoSearchParams
} from 'e2e-shared/specs/debounce.defs'

export function loader({ request }: LoaderFunctionArgs) {
  return loadDemoSearchParams(request)
}

export default function Page() {
  const serverState = useLoaderData<DemoSearchParams>()
  return (
    <DebounceServer state={serverState}>
      <DebounceClient navigateHref="/debounce/other" />
    </DebounceServer>
  )
}
