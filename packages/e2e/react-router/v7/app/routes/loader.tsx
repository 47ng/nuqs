import { LoaderRenderer, loadSearchParams } from 'e2e-shared/specs/loader'
import type { LoaderFunctionArgs } from 'react-router'
import type { Route } from './+types/loader'

export function loader({ request }: LoaderFunctionArgs) {
  return loadSearchParams(request)
}

export default function Page({
  loaderData: serverValues
}: Route.ComponentProps) {
  return <LoaderRenderer serverValues={serverValues} />
}
