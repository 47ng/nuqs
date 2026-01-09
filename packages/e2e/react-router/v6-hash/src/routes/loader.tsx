import { LoaderRenderer, loadSearchParams } from 'e2e-shared/specs/loader'
import { useLoaderData, type LoaderFunctionArgs } from 'react-router-dom'

export function loader({ request }: LoaderFunctionArgs) {
  return loadSearchParams(request)
}

export default function Page() {
  const serverValues = useLoaderData() as Awaited<ReturnType<typeof loader>>
  return <LoaderRenderer serverValues={serverValues} />
}
