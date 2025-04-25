import { DebounceClient } from 'e2e-shared/specs/debounce-client'
import { DebounceServer } from 'e2e-shared/specs/debounce-server'
import { loadDemoSearchParams } from 'e2e-shared/specs/debounce.defs'
import type { LoaderFunctionArgs } from 'react-router'
import type { Route } from './+types/debounce'

export function loader({ request }: LoaderFunctionArgs) {
  return loadDemoSearchParams(request)
}

export default function Page({
  loaderData: serverState
}: Route.ComponentProps) {
  return (
    <DebounceServer state={serverState}>
      <DebounceClient navigateHref="/debounce/other" />
    </DebounceServer>
  )
}
