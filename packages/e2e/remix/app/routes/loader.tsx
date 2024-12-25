import type { LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { LoaderRenderer, loadSearchParams } from 'e2e-shared/specs/loader'

export function loader({ request }: LoaderFunctionArgs) {
  return loadSearchParams(request)
}

export default function Page() {
  const serverValues = useLoaderData<typeof loader>()
  return <LoaderRenderer serverValues={serverValues} />
}
