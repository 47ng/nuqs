import type { LoaderFunctionArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { Repro1184 } from 'e2e-shared/specs/repro-1184'
import { repro1184Loader } from 'e2e-shared/specs/repro-1184.defs'

export function loader({ request }: LoaderFunctionArgs) {
  return repro1184Loader(request)
}

export default function Page() {
  const { counter } = useLoaderData<typeof loader>()
  return <Repro1184 serverCounter={counter} />
}
